/**
 * 获取分享的歌曲或歌单
 */

const { GetShareMusicList } = require('../../model/Player');
const { port } = require('../../config/server');

module.exports = async (req, res) => {
	let { key, val } = req.query;

	if (!['mid', 'pid'].includes(key)) {
		return res.errCode.req();
	}

	if (!val) return res.errCode.req();

	let isPlaylist = undefined;

	if (key === 'mid') {
		isPlaylist = false;
	} else if (key === 'pid') {
		isPlaylist = true;
	}

	let musics = await GetShareMusicList({ key, val, isPlaylist });

	if (!musics) return res.errCode.find();

	// 处理图片路径
	musics.res.forEach((v) => {
		v.cover = `http://127.0.0.1:${port}/static/music/${v.song_name}/${v.cover}`;
	});

	res.errCode.success(musics);
};
