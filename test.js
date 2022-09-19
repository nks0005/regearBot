// 디스코드 봇 모듈
const { Client, GatewayIntentBits, Collection, Utils, } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
// 봇 설정 파일
const { token, prefix } = require('./config/config.json');
// 크롤링 모듈
const axios = require('axios');

const Util = require('./modules/util.js').modules;

// 커멘드 분리
const fs = require('fs');




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

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!(message.author.id == 208970988744998912)) return;

    let msg = message.content;
    if (!msg[0] == prefix) return;

    msg = msg.substring(1).split(' ');
    const [command, ...args] = msg;

    const tmp = [...args].toString().split('<@&');

    tmp[0] = tmp[0].split('>');

    const userList = [];
    for (let user of tmp[0]) {
        console.log(user);
        if (user.includes('<@')) {
            console.log('ok');
            user = user.replace(',', '').replace(' ', '').replace('<@', '');
            userList.push(`${user}`);
        }
    }

    const roleId = `${tmp[1].replace('>', '')}`;

    await message.reply(`
    유저 리스트 : ${[...userList]}
    역할 : ${roleId}
    `);

    if (message.author.id == 208970988744998912) {

        await message.reply(`${message.author.id}, ${message.author.tag}, ${message.author.system}, ${new Date(message.author.createdTimestamp).toTimeString()}`);

        let role = message.member.guild.roles.cache.find(role => role.id === roleId);
        if (role) {
            for (const user of userList) {
                let ret = await message.guild.members.cache.get(user).roles.add(role);
                await message.reply(`ret : ${ret}`);

                await message.reply(`role : ${role}`);
                await message.reply(`<@${user}>에게 <@&${role}>의 권한을 주었습니다.`);
            }
        };



        const msg = await message.reply(`5초 뒤에 권한을 회수합니다`);
        await Util.sleep(5000);
        await msg.react('✅');


        if (role) {
            let ret = message.guild.members.cache.get(message.author.id).roles.remove(role);
            //await message.reply(`ret : ${ret}`);
            //console.log(ret);

            await message.reply(`role : ${role}`);
            await message.reply(`${message.author.id}, ${message.author.username}에게 <@${role}>의 권한을 회수했습니다.`);
        }
    }

});

client.on('interactionCreate', async interaction => {
    const { commandName } = interaction;
    if (!interaction.isChatInputCommand()) return;

    const message = await interaction.reply({ content: 'check', fetchReply: true });
    const react = message.guild.emojis.cache.find(emoji => emoji.name == 'white_check_mark');
    console.log('🔒');
    message.react('✅');


});



client.login(token);