/**
 * 音乐播放器歌单配置
 */

const router = require('express').Router();
const Token = require('../../libs/Token');

// 歌曲歌单相关路由
router.get('/public', require('../Player/Playlist').GetPublicPlaylist);
router.get(
	'/private',
	tokenAuth,
	require('../Player/Playlist').GetPrivatePlaylist
);
router.get(
	'/public/music',
	require('../Player/Playlist').GetPublicPlaylistMusic
);
router.get(
	'/private/music',
	tokenAuth,
	require('../Player/Playlist').GetPrivatePlaylistMusic
);

router.post('/create', tokenAuth, require('../Player/Playlist').CreatePlaylist);
router.post('/add', tokenAuth, require('../Player/Playlist').MusicToPlaylist);
router.post('/del', tokenAuth, require('../Player/Playlist').DelPlaylist);
router.post('/edit', tokenAuth, require('../Player/Playlist').EditPlaylist);
router.post('/save', tokenAuth, require('../Player/Playlist').SavePlaylist);
// 获取分享的歌曲或歌单
router.get('/public/getShareMusicList', require('../Player/Share'));

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
