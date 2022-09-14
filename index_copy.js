const { Client, GatewayIntentBits } = require('discord.js');
const { token, wanthealcomeId } = require('./config/discord_config.json');
const { Channel, sequelize } = require('./models/index.js');
const Monitor = require('./modules/monitor.js').modules;
const { joinVoiceChannel } = require('@discordjs/voice');
const Util = require('./modules/util.js').modules;

const axios = require('axios');


sequelize.sync({ force: false }).then(() => {
        console.log('데이터베이스 연결 성공');
    })
    .catch((err) => {
        console.error(err);
    })

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
    console.log('Ready!');

    m = new Monitor(10000, client);
    m.updateCycle();

    // 채널 이름 변경
    const setUpdateChannel = async(client) => {
        while (true) {
            const Client = client;
            try {
                // 채널 접속
                const connection = joinVoiceChannel({
                    channelId: "1017509122729574511",
                    guildId: "748345742158200832",
                    adapterCreator: client.guilds.cache.get("748345742158200832").voiceAdapterCreator
                });

                // 업데이트 채널
                let date = new Date();
                let filteredTime = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
                const strKrTime = `Updated : ${filteredTime} KR`;

                Client.guilds.cache.get("748345742158200832").channels.cache.get("1017509122729574511").setName(strKrTime).then(() => { console.log('업데이트 시간 갱신') }).catch((err) => { console.error(err) });
                console.log(strKrTime);

                // Match / 1hour 업데이트 채널

                const processMatch = async(channelId, type) => {
                    try {
                        let matchType = Util.getURL().DOUBLE;

                        if (type == 2) {
                            matchType = Util.getURL().DOUBLE;
                        } else if (type == 5) {
                            matchType = Util.getURL().FIVE;
                        } else if (type == 10) {
                            matchType = Util.getURL().TEN;
                        }

                        const url = Util.getURL().HOME + Util.getURL().HELLGATE + Util.getURL().COUNT + matchType;
                        let ret = await axios.get(url);
                        if (ret.status == 201) {
                            console.log(`${url} : ${ret.data}`);

                            const msg = `[${type}:${type}] ${ret.data}판 `;

                            Client.guilds.cache.get("748345742158200832").channels.cache.get(`${channelId}`).setName(msg).then(() => { console.log(`${type}:${type} 매치 갱신`) }).catch((err) => { console.error(err) });
                        } else {
                            const msg = `[${type}:${type}] 0판 `;
                            Client.guilds.cache.get("748345742158200832").channels.cache.get(`${channelId}`).setName(msg).then(() => { console.log(`${type}:${type} 매치 갱신`) }).catch((err) => { console.error(err) });
                        }
                    } catch (err) { console.error(err); }
                };
                processMatch("1018762422879780864", 2);
                processMatch("1018762614299430922", 5);
                processMatch("1018762712584556575", 10);

                await Util.sleep(10 * 60 * 1000); // 10분마다

                connection.destroy();
                await Util.sleep(1000);
                /*
                 * 채널 업데이트는 10분당 2개의 요청만 가능하다.
                 * 일반 요청은 10분당 10,000개만 가능하다.
                 * https://stackoverflow.com/questions/62103163/how-often-can-i-rename-discord-channels-name
                 */
            } catch (err) {
                console.error(err);
            }
        }
    }
    setUpdateChannel(client);
});


client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'setchannel') {
        try {
            const { channelId, guildId, user: { id } } = interaction;
            console.log(`channelId : ${channelId}, guildId : ${guildId}, id : ${id}`);

            if (id != wanthealcomeId)
                await interaction.reply('권한이 필요합니다.');

            const ret = await Channel.findOne({
                where: { channelId: channelId, guildId: guildId }
            });

            if (ret) {
                interaction.reply('이미 등록되어있습니다.');
            } else {

                let crystal = -1,
                    type = -1;
                const commandType = interaction.options.getString('type');

                switch (commandType) {
                    case "hellgate_2":
                        crystal = 0;
                        type = 0;
                        break;

                    case "hellgate_5":
                        crystal = 0;
                        type = 1;
                        break;

                    case "hellgate_10":
                        crystal = 0;
                        type = 2;
                        break;

                    case "crystal_5":
                        crystal = 1;
                        type = 1;
                        break;

                    case "crystal_20":
                        crystal = 1;
                        type = 3;
                        break;

                    default:
                        throw 'Type 매개 변수가 잘못 되었습니다.';
                }

                await Channel.create({
                    guildId: guildId,
                    channelId: channelId,
                    userId: id,
                    crystal: crystal,
                    type: type
                });

                interaction.reply('정상적으로 등록되었습니다.');
            }
        } catch (err) {
            console.error(err);
            interaction.reply('등록 중 오류가 발생했습니다.');
        }
    }
});

client.login(token);