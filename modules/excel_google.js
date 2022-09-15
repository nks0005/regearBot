// https://console.developers.google.com/

const { select } = require('async');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const Util = require('../modules/util.js').modules;

class Excel_Google {
    constructor() {
        // 구글 API
        this.gs_creds = require('../config/killboard-6969e7e7fd70.json');
        // 구글 스프레드 시트 ID 값
        this.sheet_id = require('../config/config.json')['cheet_id'];
        this.doc = new GoogleSpreadsheet(this.sheet_id);
    }

    //Invalid requests[0].addSheet: The sheet name cannot be greater than 100 characters.
    async saveSheetInExcel(arrUserInfo, sheetName) {
        let ret = 0;
        try {
            await this.doc.useServiceAccountAuth(this.gs_creds);
            await this.doc.loadInfo();
            //console.log(`엑셀 제목 : ${this.doc.title}`);

            // 시트 확인
            for (const sheet of this.doc.sheetsByIndex) {
                if (sheet.title == sheetName) {
                    //console.log("기존거 삭제.");
                    await sheet.delete();
                }
            }

            // 시트 생성
            const newSheet = await this.doc.addSheet({ title: `${sheetName}`, headerValues: ['닉네임', '길드명', '평균아이템레벨', '주무기', '보조무기', '머리', ' 갑바', '신발', '망토'] });
            ret = newSheet.sheetId;

            //console.log(arrUserInfo.length);


            for (const userInfo of arrUserInfo) {
                await newSheet.addRow({
                    닉네임: userInfo.name + '\n\n\n\n\n\n',
                    길드명: userInfo.guild,
                    평균아이템레벨: parseInt(userInfo.avgIp),
                    주무기: Util.Item2Url(userInfo.Equipment.mainHand),
                    보조무기: Util.Item2Url(userInfo.Equipment.offHand),
                    머리: Util.Item2Url(userInfo.Equipment.head),
                    갑바: Util.Item2Url(userInfo.Equipment.armor),
                    신발: Util.Item2Url(userInfo.Equipment.shoes),
                    망토: Util.Item2Url(userInfo.Equipment.cape)
                });
            }

            return ret;

        } catch (err) {
            throw err;
        }
    }
}

exports.modules = Excel_Google;