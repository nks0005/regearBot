/**
 * 엑셀 제어 모듈입니다.
 * npm install xlsx
 */

const xlsx = require('xlsx');
const Util = require('./util.js').modules;

class Excel {
    constructor() {}

    saveExcel(arrUserInfo, fileName) {
        let excelData = [];

        excelData.push(
            ["닉네임", "길드명", "평균 아이템 레벨", "주무기", "보조무기", "머리", "갑바", "신발", "망토"]
        );
        for (const userInfo of arrUserInfo) {
            excelData.push(
                [userInfo.name, userInfo.guild, userInfo.avgIp,
                    Util.Item2Url(userInfo.Equipment.mainHand), Util.Item2Url(userInfo.Equipment.offHand), Util.Item2Url(userInfo.Equipment.head), Util.Item2Url(userInfo.Equipment.armor), Util.Item2Url(userInfo.Equipment.shoes), Util.Item2Url(userInfo.Equipment.cape)
                ]
            );
        }
        const workSheet = xlsx.utils.aoa_to_sheet([...excelData]);
        const workBook = xlsx.utils.book_new();

        xlsx.utils.book_append_sheet(workBook, workSheet, 'Sheet 1');

        xlsx.writeFile(workBook, `./tmp/${fileName}.xlsx`);
    }
}

exports.modules = Excel;