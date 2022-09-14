// 디스코드 봇 모듈
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
// 봇 설정 파일
const { token, prefix } = require('./config/config.json');
// 크롤링 모듈
const axios = require('axios');

// 커멘드 분리
const fs = require('fs');



// 사용 목적 고지
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
    ]
});

// 명령 파일 분할
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('js'));

for (const file of commandFiles) {
    console.log(`${file} 등록`);
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.once('ready', () => {
    console.log(`${client.user.username} 로그인 성공`);
});


client.on('interactionCreate', async interaction => {
    const { commandName } = interaction;

    if (!interaction.isChatInputCommand()) return;
    // 등록된 명령어가 맞는지 확인
    if (!client.commands.has(commandName)) return;





    // 명령어 실행
    try {
        const Id = interaction.options.getString('id');
        client.commands.get(commandName).execute(interaction, Id);
    } catch (err) {
        console.error(err);
    }
});

client.login(token);