// 등록
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { token, botApiId } = require('./config/config.json');


/**
 * hellgate_2
 * hellgate_5
 * hellgate_10
 *
 * crystal_5
 * crystal_20
 */
const commands = [
        new SlashCommandBuilder().setName('battle').setDescription('전투 로그로 부터 리기어 항목들을 얻어옵니다.').addStringOption(option => option.setName('id').setDescription('킬보드 아이디').setRequired(true)),
        new SlashCommandBuilder().setName('button').setDescription('버튼 테스트')
    ]
    .map(command => command.toJSON());


const rest = new REST({ version: '10' }).setToken(token);

rest.put(
    Routes.applicationCommands(botApiId), { body: commands },
);