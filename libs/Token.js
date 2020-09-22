const jwt = require("jsonwebtoken")
const { token } = require("../config/server")
// -----------------------------------

class Token {
    constructor() {
        this.userSign = token.userSign; // 用户token签名
        this.adminSign = token.adminSign; // 管理员token签名
        this.expire = token.expire; // token过期时间
    }


    /**
     * 生成token
     * @param {object} obj token中存储的信息
     * @return {string}
     */
    createToken(obj) {
        const TokenData = jwt.sign({
            ...obj,
            expire: Date.now() + this.expire // 3天后到期
        }, this.userSign);
        // 返回token
        return TokenData;
    }


    /**
     * 对token进行解密
     * @param {string} str token字符串
     * @param {string} [signType] token类型，user 或 admin
     * @return {string}
     */
    deCryptoToken(str, signType = "user") {
        if (!str) { console.error(`请传入token字符串！`); return; }
        // 选择签名
        let sign = signType === "admin" ? this.adminSign : this.userSign;
        // 生成token
        let tk = jwt.verify(str, sign);
        // 判断token是否存在
        if (JSON.stringify(tk) === "{}") return false;

        
        // 检查token是否过期
        if (tk.expire < Date.now()) {
            return false;
        };
        // 返回解密后的token
        return tk;
    }


}



module.exports = new Token;