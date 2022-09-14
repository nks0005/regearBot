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
        if (Type == null) return Type;

        for (const item of jsonItems) {
            if (Type == item['UniqueName']) {
                let ret = item['LocalizedNames']['KO-KR'];

                return ret;
            }
        }
    }

    static Item2Url(Item) {
        if (Item == null) return Item;
        return `=image(https://render.albiononline.com/v1/item/${Item}.png)`;
    }

    static async sleep(ms) {
        return new Promise(resolve => { setTimeout(resolve, ms) });
    }
}

exports.modules = Util;