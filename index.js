// 디스코드 봇 모듈
const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionCollector } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const { token, prefix } = require('./config/config.json');

const regear_monitor = require('./modules/regear_monitor');


// 사용 목적 고지
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,

    ]
});

client.once('ready', () => {
    console.log(`${client.user.username} 로그인 성공`);

    let rm = new regear_monitor(client);
    rm.execute();
});



client.login(token);