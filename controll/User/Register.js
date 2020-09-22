/**
 * 用户注册
 */
const { Register, UserExist } = require('../../model/User');
const { CreatePlaylist } = require('../../model/Player');
const crypto = require('../../libs/Crypto');
const DataTest = require('../../libs/DataTest');
const test = new DataTest();

module.exports = async (req, res) => {
	let { username, phone, email, password, confirmPassword } = req.body;

	// 判断手机号码格式
	if (!test.phone(phone)) return res.errCode.req('手机号码格式错误');

	// 判断密码格式
	if (!test.password(password, { minLen: 64, maxLen: 64 }))
		return res.errCode.refuse('您的密码被恶意拦截，请更换浏览器！');

	// 判断两次密码一致性
	if (password !== confirmPassword)
		return res.errCode.req('两次输入的密码不一致');

	// 判断邮箱是否正确
	if (!test.email(email)) return res.errCode.req('邮箱格式不正确');

	// 判断该用户是否已存在
	let isExist = await UserExist({ phone });

	if (isExist) return res.errCode.refuse('该账号已存在，请勿重复注册！');

	// 设置注册参数
	let params = {
		username,
		pwd: crypto.createHash(password),
		phone,
		email,
		avatar: 'default_avatar.webp',
		time: Date.now() + '',
	};

	// 生成用户标识符
	let identStr = `${params.username}${params.pwd}${params.phone}${
		params.email
	}${params.time}${randomString()}`;

	// 绑定用户标识
	params.ident = crypto.createHash(identStr);

	let state = await Register(params);

	if (!state) res.errCode.server();

	let time = Date.now() + '';

	state = await CreatePlaylist({
		playlist_id: `${time}${params.phone.slice(4)}`,
		ident: params.ident,
		playlist_name: '我喜欢',
		time,
	});

	if (state) {
		res.errCode.success(state);
	} else {
		res.errCode.server();
	}
};

// 生成随机字符串
function randomString(length = 36) {
	let chars =
		'0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	let result = '';
	for (let i = length; i > 0; --i)
		result += chars[Math.floor(Math.random() * chars.length)];
	return result;
}
