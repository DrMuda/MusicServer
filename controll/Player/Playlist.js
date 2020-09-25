/**
 * 歌单处理
 */

const {
	CreatePlaylist,
	MusicToPlaylist,
	GetPublicPlaylist,
	GetPublicPlaylistMusic,
	GetPrivatePlaylist,
	GetPrivatePlaylistMusic,
	GetLikeMusics,
	DelPlaylist,
	EditPlaylist,
	SavePlaylist,
} = require('../../model/Player');
const { port } = require('../../config/server');

/**
 * 新建歌单
 */
exports.CreatePlaylist = async (req, res) => {
	let ident = req.ident;
	let { phone } = req.token;
	let { playlist_name } = req.body;
	// 验证歌单名是否合法
	if (!/^([\u4e00-\u9fa5]|[a-zA-Z0-9]){1,30}$/.test(playlist_name)) {
		return res.errCode.req();
	}

	let time = Date.now() + '';
	let playlist_id = `${time}${phone.slice(4)}`;

	let state = await CreatePlaylist({
		playlist_id,
		ident,
		playlist_name,
		time,
	});

	if (state) {
		res.errCode.success();
	} else {
		res.errCode.server();
	}
};

/**
 * 添加歌曲至歌单
 */
exports.MusicToPlaylist = async (req, res) => {
	let ident = req.ident;
	let { song_id, playlist_id } = req.body;

	let result = await MusicToPlaylist({
		ident,
		song_id,
		playlist_id,
		time: Date.now() + '',
	});

	if (result) {
		res.errCode.success();
	} else {
		res.errCode.server();
	}
};

/**
 * 删除歌单
 */
exports.DelPlaylist = async (req, res) => {
	let ident = req.ident;
	let { playlist_id } = req.body;
	let state = await DelPlaylist({ ident, playlist_id });

	if (state) {
		res.errCode.success();
	} else {
		res.errCode.server();
	}
};

// 编辑歌单
exports.EditPlaylist = async (req, res) => {
	let ident = req.ident;
	let { playlist_id, playlist_name, tags, secret } = req.body;

	if (playlist_name.trim().length <= 0 || playlist_name.trim().length > 30) {
		return res.errCode.req();
	}

	if ([0, 1, 2, 3, 4].includes(tags) === false) {
		return res.errCode.req();
	}

	if ([0, 1].includes(secret) === false) {
		return res.errCode.req();
	}

	let state = await EditPlaylist({
		ident,
		playlist_id,
		playlist_name,
		tags,
		secret,
	});

	if (state) {
		res.errCode.success();
	} else {
		res.errCode.req();
	}
};

/**
 * 保存歌单
 */
exports.SavePlaylist = async (req, res) => {
	let { phone } = req.token;
	let ident = req.ident;
	let { playlist } = req.body;

	let time = Date.now() + '';
	let playlist_id = `${time}${phone.slice(4)}`;
	let playlist_name = time;

	let state = await SavePlaylist({
		ident,
		playlist_id,
		playlist,
		playlist_name,
		time,
	});

	if (state) {
		res.errCode.success();
	} else {
		res.errCode.req();
	}
};

/*
 * 获取公开歌单
 */
exports.GetPublicPlaylist = async (req, res) => {
	let { search_type, page_index, page_size } = req.query;
	let result = await GetPublicPlaylist({
		search_type,
		page_index,
		page_size,
	});

	if(!result) return res.errCode.find();

	result = res.delCol(result, ['ident']);

	// 处理图片路径
	result.res.forEach((v) => {
		try {
			if(v.cover){
				v.cover = `http://127.0.0.1:${port}/static/music/${v.cover.split(".")[0]}/${v.cover}`;
			} else {
				v.cover = `http://127.0.0.1:${port}/static/images/default_cover.jpg`;
			}
		} catch (error) {
			v.cover = `http://127.0.0.1:${port}/static/images/default_cover.jpg`;
		}
	});
	
	res.errCode.success(result);
	
};

/**
 * 获取私有歌单
 */
exports.GetPrivatePlaylist = async (req, res) => {
	let ident = req.ident;
	let data = await GetPrivatePlaylist({ ident });

	data = res.delCol(data, ['ident']);

	if (data) {
		// 处理图片路径
		data.res.forEach((v) => {
			try {
				if(v.cover){
					v.cover = `http://127.0.0.1:${port}/static/music/${v.cover.split(".")[0]}/${v.cover}`;
				} else {
					v.cover = `http://127.0.0.1:${port}/static/images/default_cover.jpg`;
				}
			} catch (error) {
				v.cover = `http://127.0.0.1:${port}/static/images/default_cover.jpg`;
			}
		});
		res.errCode.success(data);
	} else {
		res.errCode.find();
	}
};

/*
 * 获取公开歌单歌曲
 */
exports.GetPublicPlaylistMusic = async (req, res) => {
	let { playlist_id } = req.query;
	let musics = await GetPublicPlaylistMusic({ playlist_id });

	if (musics) {
		let ids = [];
		// 处理图片路径
		musics.res = musics.res.filter((v) => {
			if(!ids.includes(v.song_id)){
				v.cover = `http://127.0.0.1:${port}/static/music/${v.song_name}/${v.cover}`;
				ids.push(v.song_id);
				return true;
			};
			return false;
		});
		musics.count = musics.res.length;
		res.errCode.success(musics);
	} else {
		res.errCode.find();
	}
};

/**
 * 获取私有歌单歌曲
 */
exports.GetPrivatePlaylistMusic = async (req, res) => {
	let ident = req.ident;
	// 获取搜索类型
	let { playlist_id } = req.query;

	let musics = null;
	// 判断是否是查询“我喜欢”
	if (/^like$/.test(playlist_id)) {
		musics = await GetLikeMusics({ ident });
	} else {
		musics = await GetPrivatePlaylistMusic({ ident, playlist_id });
	}

	// -----------------------------查询其他歌曲

	if (musics) {
		let ids = [];
		// 处理图片路径
		musics.res = musics.res.filter((v) => {
			if(!ids.includes(v.song_id)){
				v.cover = `http://127.0.0.1:${port}/static/music/${v.song_name}/${v.cover}`;
				ids.push(v.song_id);
				return true;
			};
			return false;
		});
		musics.count = musics.res.length;
		res.errCode.success(musics);
	} else {
		res.errCode.find();
	}
};
