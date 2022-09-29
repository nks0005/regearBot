const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionCollector } = require('discord.js');

const Util = require('./util').modules;

/*
 * 특정 채널에 쓰레드가 생성되는지 여부를 확인한다.
 * 쓰레드가 생성되면 해당 채널을 모니터링한다.
 */
class regear_monitor {
    constructor(Client) {
        this.client = Client;
        this.guildId = "1019631923968086086";
        this.channelId = "1022870832487350272";

        
    }

    /**
     * 버튼 제어를 담당한다.
     * @param {*} msg 
     */
    async processButton(msg) {
        const splitMsg = msg.customId.split('_');
        const command = splitMsg[0];

        const defaultCoin = [1800000, 900000, 500000, 200000];

        // 세트 설정
        if (command === 'set') {
            const username = splitMsg[1];
            const count = splitMsg[2];
            const msgId = splitMsg[3];

            const row = new ActionRowBuilder();
            const buttonStyle = [ButtonStyle.Success, ButtonStyle.Primary, ButtonStyle.Secondary, ButtonStyle.Secondary];

            for (var i = 0; i < defaultCoin.length; i++) {
                let coin = defaultCoin[i] * count;
                row.addComponents(new ButtonBuilder().setCustomId(`add_${username}_${coin}_${msgId}`).setLabel(`${(coin/1000000).toFixed(1)} 밀`).setStyle(buttonStyle[i]));
            }

            let undo = 1
            if (count > 4)
                undo = 2

            row.addComponents(new ButtonBuilder().setCustomId(`next_${username}_${undo}_${msgId}`).setLabel('돌아가기').setStyle(ButtonStyle.Danger));

            await msg.deferUpdate();
            await msg.editReply({ components: [row] });
        }

        // 리기어 가치 결정
        if (command === 'add') {
            const username = splitMsg[1];
            const coin = splitMsg[2];
            const msgId = splitMsg[3];

            await msg.channel.send(`&addmoney <@${username}> ${coin}`);
            await msg.deferUpdate();
            await msg.deleteReply();

            const editedMsg = await msg.channel.messages.fetch(msgId);
            await editedMsg.react('✅');

        }

        if (command === 'next') {
            const username = splitMsg[1];
            const next = splitMsg[2];
            const msgId = splitMsg[3];

            const row = new ActionRowBuilder();

            if (next === '2') {
                row.addComponents(new ButtonBuilder().setCustomId(`set_${username}_4_${msgId}`).setLabel('4 세트').setStyle(ButtonStyle.Success))
                    .addComponents(new ButtonBuilder().setCustomId(`set_${username}_5_${msgId}`).setLabel('5 세트').setStyle(ButtonStyle.Success))
                    .addComponents(new ButtonBuilder().setCustomId(`set_${username}_6_${msgId}`).setLabel('6 세트').setStyle(ButtonStyle.Success))
                    .addComponents(new ButtonBuilder().setCustomId(`next_${username}_1_${msgId}`).setLabel('<').setStyle(ButtonStyle.Primary));
            } else if (next === '1') {
                row.addComponents(new ButtonBuilder().setCustomId(`set_${username}_1_${msgId}`).setLabel('1 세트').setStyle(ButtonStyle.Success))
                    .addComponents(new ButtonBuilder().setCustomId(`set_${username}_2_${msgId}`).setLabel('2 세트').setStyle(ButtonStyle.Success))
                    .addComponents(new ButtonBuilder().setCustomId(`set_${username}_3_${msgId}`).setLabel('3 세트').setStyle(ButtonStyle.Success))
                    .addComponents(new ButtonBuilder().setCustomId(`next_${username}_2_${msgId}`).setLabel('>').setStyle(ButtonStyle.Primary));
            }

            row.addComponents(new ButtonBuilder().setCustomId(`cancel_${username}_`).setLabel('취소').setStyle(ButtonStyle.Danger));
            await msg.deferUpdate();
            await msg.editReply({ components: [row] });
        }

        // 현재 선택된 리기어 취소
        if (command === 'cancel') {
            await msg.deferUpdate();
            await msg.deleteReply();
        }

        // 리기어 종료
        if (command === 'stop') {
            await msg.deferUpdate();
            await msg.editReply({ components: [] });
        }
    }

    async processPermission(msg) {
        // 명령어 분할

    }

    /**
     * 메시지에 사진이 같이 있으면 msg.attachments에 값이 존재한다.
     * @param {*} msg
     */
    async processRegear(msg) {

        if (msg.content.includes('$')) { processPermission(msg); return; };

        // 사진이 없다면
        if (msg.attachments.size == 0) return;
        const msgId = msg['id'];

        const { id, username } = msg.author;
        const attachments = msg.attachments;
        const userMsg = msg.content;
        let pictures = [];

        for (const [key, value] of attachments) {
            const { url, name, id } = value;
            pictures.push({ attachment: url, name: `${name}`, description: `<@${id}>의 사진입니다.` });
        }

        const row = new ActionRowBuilder()
            .addComponents(new ButtonBuilder().setCustomId(`set_${id}_1_${msgId}`).setLabel('1 세트').setStyle(ButtonStyle.Success))
            .addComponents(new ButtonBuilder().setCustomId(`set_${id}_2_${msgId}`).setLabel('2 세트').setStyle(ButtonStyle.Success))
            .addComponents(new ButtonBuilder().setCustomId(`set_${id}_3_${msgId}`).setLabel('3 세트').setStyle(ButtonStyle.Success))
            .addComponents(new ButtonBuilder().setCustomId(`next_${id}_2_${msgId}`).setLabel('>').setStyle(ButtonStyle.Primary))
            .addComponents(new ButtonBuilder().setCustomId(`cancel_${id}_`).setLabel('취소').setStyle(ButtonStyle.Danger));
        await msg.channel.send({ content: `${username} <@${id}>의 리기어 사진입니다.\n\`${userMsg}\``, files: pictures, components: [row] });

        //await msg.delete(3000);
    }

    /**
     * 쓰레드가 생성될 경우 해당 쓰레드에 접근해야 한다.
     * @param {*} m
     */
    async processThread(msg) {
        const reference = msg.reference;

        console.log(` 생성된 쓰레드에 접근합니다.`);
        console.log(` guild Id : ${reference.guildId}, channel Id : ${reference.channelId}`);



        await Util.sleep(1000);
        let newThread = this.client.channels.cache.get(reference.channelId);
        if (!newThread) return ` 쓰레드 접근 도중 에러가 발생했습니다.`;

        await msg.channel.send(`<@${msg.author.id}> ${new Date().toLocaleTimeString()} 시간에 쓰레드를 생성하였습니다.`);

        const row = new ActionRowBuilder()
            .addComponents(new ButtonBuilder().setCustomId(`stop_regear`).setLabel('리기어 종료').setStyle(ButtonStyle.Danger));
        await newThread.send({ content: `양식에 맞추어 작성해주세요.\n리기어 여부 : \n분배 여부 : \n날짜 : \n콜러 이름 : \n싸움 형태 : \n상자 : \n파티 인원 : \n`, components: [] });

        // 생성된 쓰레드안에 메시지 모니터링을 시작합니다.
        {
            const filter = m => !m.author.bot || m.content.includes('$');
            const collector = newThread.createMessageCollector({
                filter: filter,
                time: 24 * 60 * 60 * 1000
            });

            collector.on('collect', async msg => this.processRegear(msg, collector));

            collector.on('end', collected => {
                console.log(`Collected ${collected.size} items`);
            });
        }

        // 생성된 쓰레드안에 버튼 모니터링을 시작합니다.
        {
            const filter = m => m.customId.includes('_');
            const collector = newThread.createMessageComponentCollector({
                filter: filter,
                time: 24 * 60 * 60 * 1000
            });

            collector.on('collect', async msg => this.processButton(msg));

            collector.on('end', collected => {
                console.log(`Collected ${collected.size} items`);
            });
        }
    }

    /**
     * 쓰레드가 생성될 경우 msg.reference안에 값이 존재한다.
     * @param {*} msg
     */
    async monitorChannel(msg) {
        console.log(` 메시지가 들어왔습니다.`);

        // 쓰레드가 생성되지 않았다면
        if (msg.reference == undefined) return;

        console.log(` 쓰레드가 감지되었습니다.`);
        await this.processThread(msg);
    }

    async execute() {
        console.log(` 채널 모니터링을 진행합니다.`);

        // 봇이라면 반응하지 않는다.
        const filter = m => !m.author.bot;
        const collector = this.client.guilds.cache.get(this.guildId).channels.cache.get(this.channelId).createMessageCollector({
            filter: filter,
            time: 24 * 60 * 60 * 1000
        });

        collector.on('collect', async msg => this.monitorChannel(msg));

        collector.on('end', collected => {
            console.log(`Collected ${collected.size} items`);
        });
    }
}

module.exports = regear_monitor;