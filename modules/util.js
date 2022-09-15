const jsonItems = require('./items.json');


class Util {

    static array2count(array) {
        return parseInt(Object.keys(array).length);
    }

    static Equip2Type(Equip) {
        if (Equip == null) return Equip;
        return Equip['Type'];
    }

    static Type2Kr(Type) {
        if (Type == null) return { kr: '', tier: '' };

        let tier = Type.split('@')[1];
        if (tier == undefined) tier = 0;
        tier = parseInt(tier);

        for (const item of jsonItems) {
            if (Type == item['UniqueName']) {
                let ret = item['LocalizedNames']['KO-KR'];

                return { kr: ret, tier: tier };
            }
        }
    }

    static Item2Url(Item) {
        if (Item == null) return Item;
        return `=image("https://render.albiononline.com/v1/item/${Item}.png", 4, 100, 100)`;
    }

    static async sleep(ms) {
        return new Promise(resolve => { setTimeout(resolve, ms) });
    }
}

exports.modules = Util;