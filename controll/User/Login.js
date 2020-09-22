/**
 * 用户登录
 */
const { port } = require('../../config/server');
const { Login } = require('../../model/User');
const crypto = require('../../libs/Crypto');
const Token = require('../../libs/Token');
const DataTest = require('../../libs/DataTest');
const test = new DataTest();

module.exports = async (req, res) => {
	// 获取账号和密码
	let { phone, password } = req.body;

	// 判断手机号码格式
	if (!test.phone(phone)) return res.errCode.req('手机号码格式错误');

	// 判断密码格式
	if (!test.password(password, { minLen: 64, maxLen: 64 }))
		return res.errCode.refuse('您的密码被恶意拦截，请更换浏览器！');

	// 密码二次加密
	password = crypto.createHash(password);

	// 获取用户信息
	let info = await Login({ phone, password });

	// 判断账号密码是否匹配
	if (!info) return res.errCode.refuse('账号或密码错误');

	// 删除敏感字段
	info = res.delCol(info, [
		'pwd',
		'birthday',
		'listening_song_duration',
		'isfree',
		'time',
	]);

	// 修改图片地址
	info.res[0].avatar = `http://127.0.0.1:${port}/static/avatar/${info.res[0].avatar}`;
	
	// 创建token
	let token = Token.createToken(info.res[0]);

	// 返回用户信息
	res.errCode.success({
		userinfo: info.res[0],
		token,
	});
};
