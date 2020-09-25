/**
 * 音乐播放器路由配置
 */
const router = require('express').Router();
const Token = require('../../libs/Token');

// 获取首页数据
router.get('/home/:type', require('../Player/Music').HomeData);
// 歌曲相关路由
router.get('/', tokenAuth, require('../Player/Music').GetMusic);
router.get(
	'/purchased',
	tokenAuth,
	validToken,
	require('../Player/Music').GetPurchased
);
router.get('/singer', require('../Player/Music').GetSinger);
router.post('/del',
	tokenAuth,
	validToken,
	require('../Player/Music').DelMusic);
router.get('/search', require('../Player/Music').SearchMusic);
router.get('/lyric', require('../Player/Music').GetLyric);
router.get('/ranklist', require('../Player/Music').GetRanklist);
router.get('/classified', require('../Player/Music').ClassifiedSearch);
router.post(
	'/report',
	tokenAuth,
	validToken,
	require('../Player/Music').AddReport
);
router.post(
	'/update_listen_song_duration',
	tokenAuth,
	require('../Player/Music').UpdateListenSongDuration
);

// 获取支付链接
router.get('/payment', tokenAuth, validToken, require('../Player/Payment'));

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
			req.token = null;
		}

		// 设置token
		req.token = tokenData;
		req.ident = tokenData.ident;

		next();
	} catch (error) {
		console.log(error);
		// 请求头不存在，token被篡改
		req.token = null;
		next();
	}
}

// 验证token是否为空
function validToken(req, res, next) {
	if (!req.token) {
		return res.send({
			code: 401,
			msg: '身份未认证',
		});
	}

	next();
}

module.exports = router;
