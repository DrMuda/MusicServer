const crypto = require('crypto');
const DataTest = require('./DataTest');
// -------------------------------------------------------------------


class Crypto {
	/**
	 * 哈希加密数据
	 * @param {string} str 要加密的数据
	 * @param {string} salt 混淆数据
	 * @return {string} 返回加密后的数据
	 */
	createHash(str, salt) {
		if (DataTest.rmspace(str) === '')
			throw Error(`请传入要加密的字符串 str `);
		if (DataTest.rmspace(salt) === '') throw Error(`请传入混淆数据 salt `);

		let sha512 = crypto.createHash('sha512');
		sha512.update(`${str}${salt}`); // update数据
		let result = sha512.digest('hex'); // 十六进制输出

		// 返回新密文
		return result;
	}

    // 对原始密码进行加密
	cryptoPassword(phone, pwd) {
        let sha256 = crypto.createHash('sha256');
        sha256.update(phone + pwd);
        pwd = sha256.digest("hex");
        pwd = this.createHash(pwd);
        return pwd;
	}
}

module.exports = new Crypto();
