const axios = require('axios');
const Util = require('../modules/util.js').modules;
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "battle",
    description: "",
    async execute(interaction, battleId) {

        try {
            const id = parseInt(battleId);
            await interaction.reply(`전투 아이디 ${id}를 처리중입니다.`);

            if (id == NaN) throw `Id 값이 정상 값이 아닙니다.`;

            /**
             * ID로 부터 총 몇킬을 하였는지에 대한 정보를 얻어온다.
             * https://gameinfo.albiononline.com/api/gameinfo/battles/아이디값
             */
            const totalBattleLog = await axios.get(`https://gameinfo.albiononline.com/api/gameinfo/battles/${id}`);
            if (totalBattleLog.status != 200 || totalBattleLog.data == null) throw `킬보드 ${id}에 대한 정상적인 데이터를 받지 못했습니다.`;
            await interaction.editReply(`전투 로그 얻는 중...`);

            const { totalFame, totalKills, players } = totalBattleLog.data;
            const totalPlayers = Util.array2count(players);
            /*
            console.log(`
            ${id}
            총 인원수 : ${totalPlayers}
            총 킬수 : ${totalKills}
            총 페임 : ${totalFame}`);
            */

            // 유저 정보를 저장할 배열을 생성한다.
            let arrUserInfo = new Array();

            // 이벤트 로그는 한번에 최대 50개를 불러올 수 있기 때문에 50으로 나눈다.
            const eventLoopCount = totalKills > 50 ? (totalKills / 50) + 1 : 1;
            await interaction.editReply(`이벤트 로그 얻는 중...`);
            for (var i = 0; i < eventLoopCount; i++) {
                const totalEventLog =
                    await axios.get(`https://gameinfo.albiononline.com/api/gameinfo/events/battle/${id}?offset=${i==0?0:i*50}&limit=50`);
                if (totalEventLog.status != 200 || totalEventLog.data == null) return;

                for (const eventLog of totalEventLog.data) {
                    const { Victim } = eventLog;
                    const { AverageItemPower, Name, GuildName } = Victim;

                    /**
                     * 고스톱 길드만 적용되는 봇이기에 길드가 고스톱인 유저만 받아온다.
                     * 버그 성으로 죽은 기록이 두번 남은 경우 아이템 파워가 0인 경우이다.
                     */
                    if (GuildName == "GOSTOP" && AverageItemPower != 0.0) {
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


            /*
            // 엑셀 파일로 만든다.
            await interaction.editReply(`엑셀 변환 중...`);
            let excel = new Excel();
            excel.saveExcel(arrUserInfo, `${id}`);
            await interaction.editReply(`엑셀 완료`);

            // 만든 엑셀 파일을 전송한다.
            await interaction.editReply(`엑셀 업로드 중...`);

            await interaction.editReply(`엑셀 완료`);
            */

            let thread = interaction.channel.threads.cache.find(x => x.name === `${id}`);
            await thread.delete();

            thread = await interaction.channel.threads.create({
                name: `${id}`,
                autoArchiveDuration: 60,
                reason: `${id}에 대한 스레드 생성`
            });

            if (thread.joinable) await thread.join();
            for (const userInfo of arrUserInfo) {
                const { name, guild, avgIp, Equipment: { mainHand, offHand, head, armor, shoes, cape } } = userInfo;

                const msgEmbed = new EmbedBuilder();

                const equipMsg = `
                ${Util.Type2Kr(mainHand) == null ? 'X' : Util.Type2Kr(mainHand)}
                ${Util.Type2Kr(offHand) == null ? 'X' : Util.Type2Kr(offHand)}
                ${Util.Type2Kr(head) == null ? 'X' : Util.Type2Kr(head)}
                ${Util.Type2Kr(armor) == null ? 'X' : Util.Type2Kr(armor)}
                ${Util.Type2Kr(shoes) == null ? 'X' : Util.Type2Kr(shoes)}
                ${Util.Type2Kr(cape) == null ? 'X' : Util.Type2Kr(cape)}
                `;

                msgEmbed.setColor('#0099ff').setTitle(`${name} (${parseInt(avgIp)})`)
                    .addFields({ name: '장비', value: equipMsg });


                await thread.send({ embeds: [msgEmbed] })
            }

            await interaction.editReply(`처리 완료`);
        } catch (error) {
            console.error(error);
            await interaction.editReply('에러가 발생했습니다. 담당자에게 문의해주세요');
        }
    }
}