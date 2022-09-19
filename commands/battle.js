const axios = require('axios');
const Util = require('../modules/util.js').modules;
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionCollector } = require("discord.js");
const Excel_Google = require('../modules/excel_google.js').modules;
const puppeteer = require('puppeteer');

async function trustAxios(url) {
    for (var i = 0; i < 10; i++) {
        try {
            const ret = await axios.get(url);
            return ret;
        } catch (err) {}
    }
}


module.exports = {
    name: "battle",
    description: "",
    async execute(interaction, battleId) {

        let thread;
        try {
            let battleIds = [];
            if (battleId.includes(',')) {
                let tmpBattleIds = battleId.split(',');

                for (const battleId of tmpBattleIds) {
                    battleIds.push(parseInt(battleId.trim()));
                }
            } else {
                battleIds.push(parseInt(battleId));
            }

            // 유저 정보를 저장할 배열을 생성한다.
            let arrUserInfo = new Array();
            let logGostop = { kills: 0, deaths: 0, killFame: 0 };

            if (battleIds.length == 0) throw `입력 값이 올바르지 않습니다.`;

            await interaction.reply(`${[...battleIds]}를 처리를 시작합니다.`);

            for (const id of battleIds) {

                await interaction.editReply(`전투 아이디 ${id}를 처리중입니다.`);

                if (id == NaN) throw `Id 값이 정상 값이 아닙니다.`;

                /**
                 * ID로 부터 총 몇킬을 하였는지에 대한 정보를 얻어온다.
                 * https://gameinfo.albiononline.com/api/gameinfo/battles/아이디값
                 */
                const totalBattleLog = await trustAxios(`https://gameinfo.albiononline.com/api/gameinfo/battles/${id}`);
                if (totalBattleLog == undefined) throw `킬보드 ${id}에 대한 정상적인 데이터를 받지 못했습니다.`;

                if (totalBattleLog.status != 200 || totalBattleLog.data == null) throw `킬보드 ${id}에 대한 정상적인 데이터를 받지 못했습니다.`;
                await interaction.editReply(`전투 로그 얻는 중...`);

                const { totalFame, totalKills, players, guilds } = totalBattleLog.data;
                const totalPlayers = Util.array2count(players);
                const { kills, deaths, killFame } = guilds['7RUPfYr5QZGZ6inXy0pefQ'];

                logGostop.kills += parseInt(kills);
                logGostop.deaths += parseInt(deaths);
                logGostop.killFame += parseInt(killFame);

                // 이벤트 로그는 한번에 최대 50개를 불러올 수 있기 때문에 50으로 나눈다.
                const eventLoopCount = totalKills > 50 ? (totalKills / 50) + 1 : 1;
                await interaction.editReply(`이벤트 로그 얻는 중...`);
                for (var i = 0; i < eventLoopCount; i++) {
                    const totalEventLog =
                        await trustAxios(`https://gameinfo.albiononline.com/api/gameinfo/events/battle/${id}?offset=${i==0?0:i*50}&limit=50`);
                    if (totalEventLog == undefined) throw `킬보드 ${id}에 대한 정상적인 데이터를 받지 못했습니다.`;
                    if (totalEventLog.status != 200 || totalEventLog.data == null) throw `킬보드 ${id}에 대한 정상적인 데이터를 받지 못했습니다.`;

                    for (const eventLog of totalEventLog.data) {
                        const { Victim } = eventLog;
                        const { AverageItemPower, Name, GuildName, GuildId } = Victim;

                        /**
                         * 고스톱 길드만 적용되는 봇이기에 길드가 고스톱인 유저만 받아온다.
                         * 버그 성으로 죽은 기록이 두번 남은 경우 아이템 파워가 0인 경우이다.
                         */
                        if (GuildId == "7RUPfYr5QZGZ6inXy0pefQ" && AverageItemPower != 0.0) {
                            // 착용 중인 장비들의 리스트를 불러온다.
                            const { Equipment: { MainHand, OffHand, Head, Armor, Shoes, Cape } } = Victim;

                            let tmpUserInfo = {
                                name: Name,
                                guild: GuildName,
                                avgIp: AverageItemPower,
                                Equipment: {
                                    mainHand: Util.Equip2Type(MainHand),
                                    offHand: Util.Equip2Type(OffHand),
                                    head: Util.Equip2Type(Head),
                                    armor: Util.Equip2Type(Armor),
                                    shoes: Util.Equip2Type(Shoes),
                                    cape: Util.Equip2Type(Cape)
                                }
                            };
                            arrUserInfo.push(tmpUserInfo);
                        }
                    }
                }
            }
            // 시트 이름 설정
            let sheetName = 0;
            for (const battleid of battleIds) {
                sheetName += battleid;
            }


            // 쓰레드 안에서 쓰레드를 생성할 수 없습니다.
            if (!interaction.channel.isThread()) {
                thread = interaction.channel.threads.cache.find(x => x.name === `${sheetName}`);
                if (thread != undefined) { await interaction.editReply(`이미 ${sheetName} 쓰레드가 존재합니다.`); return; }

                // 쓰레드 생성
                await interaction.editReply(`쓰레드 생성 중...`);
                thread = await interaction.channel.threads.create({
                    name: `${sheetName}`,
                    autoArchiveDuration: 60,
                    reason: `${[...battleIds]}에 대한 스레드 생성`
                });

            } else {
                await interaction.editReply(`쓰레드 안에서 쓰레드를 생성할 수 없습니다.`);
                thread = interaction.channel;
            }



            // 엑셀 파일로 만든다.
            await interaction.editReply(`엑셀 변환 중...`);
            let excel = new Excel_Google();
            let gid = await excel.saveSheetInExcel(arrUserInfo, `${sheetName}`);
            await interaction.editReply(`엑셀 변환 완료...`);

            await interaction.editReply(`쓰레드 처리중...`);

            if (thread.joinable) await thread.join();
            // 쓰레드 채널에 구글 시트 링크 첨부
            //await thread.send(`https://docs.google.com/spreadsheets/d/1qrxQ0ccsM-RdaCs49jG4MYt48ozpuuy-5pkcLRp7L5A/edit#gid=${gid}`);
            await thread.send(`
========================================
\`${[...battleIds]}\` 킬보드입니다.
쓰레드 : \`${sheetName}\`
길드 : \`GOSTOP\`

총 킬 수 : \`${logGostop.kills}\`
총 데스 수 : \`${logGostop.deaths}\`
총 킬페임 : \`${logGostop.killFame}\`
========================================
            \n\n\n
            `);


            // 쓰레드 채널에 버튼 함수 등록
            const filter = i => i.customId.includes('_') && i.member.roles.cache.has('1020544016456101939');
            // interaction 채널이 아니라, 쓰래드 채널이여야 함.
            // const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });
            const collector = await thread.createMessageComponentCollector({ filter, max: (arrUserInfo.length * 2) * 10, time: 60 * 60 * 1000 });

            collector.on('collect', async i => {
                const command = i.customId.split('_')[0];

                if (command === 'add') {

                    const name = i.customId.split('_')[1]
                    const coin = parseInt(`${i.customId.split('_')[2]}`);

                    // 메시지 버튼 생성
                    let row = new ActionRowBuilder()
                        .addComponents(new ButtonBuilder().setCustomId(`success_${name}_${coin}`).setLabel('완료').setStyle(ButtonStyle.Success))
                        .addComponents(new ButtonBuilder().setCustomId(`cancel_${name}_${coin}`).setLabel('다시 시도').setStyle(ButtonStyle.Danger));
                    await i.deferUpdate();
                    await i.editReply({ content: `\`${name}\`에게 \`${coin}\` 입금이 맞습니까?`, components: [row] });
                } else if (command === 'success') {
                    const name = i.customId.split('_')[1]
                    const coin = parseInt(`${i.customId.split('_')[2]}`);

                    await i.deferUpdate();
                    const message = await i.editReply({ content: `명령어 생성 완료`, components: [], embeds: [] });
                    message.react('✅');

                    const ret = await i.channel.send({ content: `&add-money @${name} ${coin}\n` });
                } else if (command === `cancel`) {
                    const name = i.customId.split('_')[1];

                    let row = new ActionRowBuilder()
                        .addComponents(new ButtonBuilder().setCustomId(`add_${name}_1800000`).setLabel('1.8밀').setStyle(ButtonStyle.Success))
                        .addComponents(new ButtonBuilder().setCustomId(`add_${name}_900000`).setLabel('0.9밀').setStyle(ButtonStyle.Primary))
                        .addComponents(new ButtonBuilder().setCustomId(`add_${name}_500000`).setLabel('0.5밀').setStyle(ButtonStyle.Secondary))
                        .addComponents(new ButtonBuilder().setCustomId(`add_${name}_200000`).setLabel('0.2밀').setStyle(ButtonStyle.Secondary))
                        .addComponents(new ButtonBuilder().setCustomId(`wrong_${name}_`).setLabel('제거').setStyle(ButtonStyle.Danger))

                    await i.deferUpdate();
                    await i.editReply({ content: ` `, components: [row] });

                } else if (command === 'wrong') {
                    const name = i.customId.split('_')[1]
                    const coin = parseInt(`${i.customId.split('_')[2]}`);

                    await i.deferUpdate();
                    await i.deleteReply();
                }


            });
            collector.on('end', collected => console.log(`Collected ${collected.size} items. 종료합니다.`));


            const changeDir = __dirname.replace('commands', '');

            const browser = await puppeteer.launch({ defaultViewport: { x: 10, y: 10, width: 500, height: 500 } });
            const page = await browser.newPage();
            await page.setJavaScriptEnabled(true);


            for (const userInfo of arrUserInfo) {
                const { name, guild, avgIp, Equipment: { mainHand, offHand, head, armor, shoes, cape } } = userInfo;


                // 임베디드 생성
                const msgEmbed = new EmbedBuilder();

                // TODO - 최적화 필요
                const arrEquip = new Array();
                arrEquip.push(mainHand);
                arrEquip.push(offHand);
                arrEquip.push(head);
                arrEquip.push(armor);
                arrEquip.push(shoes);
                arrEquip.push(cape);

                let equipMsg = ``;
                for (const equip of arrEquip) {
                    if (equip == null) continue;

                    const { kr, master, tier } = Util.Type2Kr(equip);
                    equipMsg += `${kr} (${master}.${tier})\n`;
                }


                msgEmbed.setColor('#0099ff').setTitle(`${name} (${parseInt(avgIp)})`)
                    .addFields({ name: '장비', value: equipMsg })
                    .addFields({ name: '특이사항', value: '없음' });

                // 메시지 버튼 생성
                let row = new ActionRowBuilder()
                    .addComponents(new ButtonBuilder().setCustomId(`add_${name}_1800000`).setLabel('1.8밀').setStyle(ButtonStyle.Success))
                    .addComponents(new ButtonBuilder().setCustomId(`add_${name}_900000`).setLabel('0.9밀').setStyle(ButtonStyle.Primary))
                    .addComponents(new ButtonBuilder().setCustomId(`add_${name}_500000`).setLabel('0.5밀').setStyle(ButtonStyle.Secondary))
                    .addComponents(new ButtonBuilder().setCustomId(`add_${name}_200000`).setLabel('0.2밀').setStyle(ButtonStyle.Secondary))
                    .addComponents(new ButtonBuilder().setCustomId(`wrong_${name}_`).setLabel('제거').setStyle(ButtonStyle.Danger))



                // 사진 생성
                // template.html 수정
                while (true) {
                    try {

                        let fs = require('fs');
                        let data = await fs.readFileSync('./tmp/template.html', 'utf-8');

                        data = data.replace("${mainHand}", mainHand);
                        if (mainHand.includes('2H')) data = data.replace('https://render.albiononline.com/v1/item/${offHand}.png', './gray.png');
                        else data = data.replace("${offHand}", offHand);
                        data = data.replace("${cape}", cape);
                        data = data.replace("${head}", head);
                        data = data.replace("${armor}", armor);
                        data = data.replace("${shoes}", shoes);
                        data = data.replace("${cape}", cape);


                        await fs.writeFileSync(`./tmp/${sheetName}.html`, data);

                        //console.log(__dirname);
                        //C:\Users\root\Documents\GitHub\regearBot\commands


                        await page.goto(`file:///${changeDir}tmp/${sheetName}.html`);
                        await page.waitForSelector('#example', {
                            timeout: 10000
                        });
                        await page.screenshot({
                            path: `./tmp/${sheetName}.png`
                        });


                        break;
                    } catch (err) {

                    }
                }

                // 사진 종료



                await thread.send({ embeds: [msgEmbed], components: [row], files: [`./tmp/${sheetName}.png`] });
            }
            await browser.close();

            await thread.send(`============ 여기까지입니다. ============`);

            await interaction.deleteReply();

        } catch (error) {
            console.error(error);
            await interaction.channel.send('에러가 발생했습니다. 담당자에게 문의해주세요');
            if (thread) await thread.delete();
        }
    }
}