/**
 * 音乐播放器评论配置
 */

const router = require('express').Router();
const Token = require('../../libs/Token');

// 歌曲评论相关路由
router.get('/', require('../Player/Comment').GetComment);
router.post('/add', tokenAuth, require('../Player/Comment').AddComment);
router.post('/like', tokenAuth, require('../Player/Comment').LikeComment);
router.post('/reply', tokenAuth, require('../Player/Comment').AddReply);

// token中间件
function tokenAuth(req, res, next) {
	try {
		// 拆分token
		let authorization = String(req.headers['authorization'])
			.split(' ')
			.pop();
		// 解析token
		let tokenData = Token.deCryptoToken(authorization, '用户签名');

		if (!tokenData) {
			return res.send({
				code: 401,
				msg: '身份未认证',
			});
		}

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
