/**
 * 用户路由配置
 */

const router = require('express').Router();
const Token = require('../../libs/Token');

// 用户登录
router.post('/Login', require('../User/Login'));
// 用户注册
router.post('/Register', require('../User/Register'));
// 检测用户是否存在
router.get('/Exist', require('../User/Exist'));
// 获取用户密保问题
router.get('/security', tokenAuth, require('../User/Info').GetSecurity);
// 获取用户密保问题（公开接口）
router.post('/security', require('../User/Info').FindPublistSecurityQuestion);
// 获取我的评论
router.get('/Comment',tokenAuth, require('../User/Comment').GetComment);
// 删除我的评论
router.post('/Comment/del',tokenAuth, require('../User/Comment').DelComment);
// 修改个人信息
router.post('/personal', tokenAuth, require('../User/Info').UpdateInfo);
// 修改密码
router.post('/changepwd', tokenAuth, require('../User/Info').ChangePassword);
// 重置密码
router.post('/resetpwd', require('../User/Info').ResetPassword);
// 上传头像
router.post('/upload/avatar', tokenAuth, require('../User/Info').UploadAvatar);

// token中间件
function tokenAuth(req, res, next) {
	try {
		// 拆分token
		let authorization = String(req.headers['authorization'])
			.split(' ')
			.pop();
		// 解析token
		let tokenData = Token.deCryptoToken(authorization, '用户签名');
		// 判断token是否过期
		if (tokenData.expire <= Date.now()) {
			return res.send({
				code: 401,
				msg: '身份未认证',
			});
		}

		// 设置token
		req.token = tokenData;
		req.ident = tokenData.ident;

		next();
	} catch (error) {
		console.log(error);
		// 请求头不存在，token被篡改
		res.send({
			code: 401,
			msg: '身份未认证',
		});
	}
}

module.exports = router;
