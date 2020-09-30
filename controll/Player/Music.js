/**
 * 音乐处理
 */
const path = require('path');
const fs = require('fs');
const { audioSavePath } = require('../../config/server');
const { port } = require('../../config/server');
const {
	GetHomeRecommend,
	GetHomeNewSong,
	GetHomeRankingList,
	GetMusic,
	GetPurchased,
	GetSinger,
	DelMusic,
	Ownership,
	SearchMusic,
	GetRankingList,
	ClassifiedSearch,
	AddReport,
	UpdateListenSongDuration,
} = require('../../model/Player');

// 读取文件
function downloadFn(song_name) {
	let song_path = `${path.join(
		audioSavePath,
		song_name,
		song_name + '.mp3'
	)}`;
	return new Promise((res, rej) => {
		fs.readFile(song_path, 'binary', (err, result) => {
			if (err) rej(err);
			res(result);
		});
	});
}

// ----------------------------------------------------------
/**
 * 获取首页数据
 */
exports.HomeData = async (req, res) => {
	let params = req.params.type;

	// 查询首页歌曲推荐
	if (params === 'recommend') {
		let { index, type } = req.query;

		type = Number(type);

		if ([0, 1, 2, 3, 4].includes(type) === false) {
			return res.errCode.req();
		}

		let result = await GetHomeRecommend({ index, type });

		if (result) {
			result.res.forEach((v) => {
				v.cover = `http://127.0.0.1:${port}/static/music/${v.song_name}/${v.cover}`;
			});
			return res.errCode.success(result);
		} else {
			return res.errCode.find();
		}
	}

	// 查询首页新歌推荐
	if (params === 'new_song') {
		let { index, type } = req.query;

		type = Number(type);

		if ([0, 1, 2, 3, 4].includes(type) === false) {
			return res.errCode.req();
		}

		let result = await GetHomeNewSong({ index, type });

		if (result) {
			result.res.forEach((v) => {
				v.cover = `http://127.0.0.1:${port}/static/music/${v.song_name}/${v.cover}`;
			});
			return res.errCode.success(result);
		} else {
			return res.errCode.find();
		}
	}

	// 查询首页五大排行榜数据
	if (params === 'ranking_list') {
		let { res: list } = await GetHomeRankingList();

		let newData = {
			// 热歌
			HotSong: [],
			// 新歌
			NewSong: [],
			// 欧美
			WesternSong: [],
			// 日韩
			JapanAndKoreaSong: [],
			// 中文
			MandarinSong: [],
		};

		list.forEach((item, index) => {
			item.forEach((v) => {
				let data = {
					id: v.song_id,
					songName: v.song_name,
					singer: v.singer_name,
					duration: '00:00',
					cover: `http://127.0.0.1:${port}/static/music/${v.song_name}/${v.cover}`,
					song_style: v.song_style,
					song_language: v.song_language,
					playback_times: v.playback_times,
					time: v.time,
					vip: v.price,
				};

				switch (index) {
					case 0:
						newData.HotSong.push(data);
						break;
					case 1:
						newData.NewSong.push(data);
						break;
					case 2:
						newData.WesternSong.push(data);
						break;
					case 3:
						newData.JapanAndKoreaSong.push(data);
						break;
					case 4:
						newData.MandarinSong.push(data);
						break;
				}
			});
		});

		if (newData) {
			res.errCode.success(newData);
		} else {
			res.errCode.server();
		}
	}
};

/**
 * 获取歌曲
 */
exports.GetMusic = async (req, res) => {
	let ident = req.ident;
	let { song_id, valid } = req.query;

	valid = Number(valid);

	if (typeof valid !== 'number' || ![0, 1].includes(valid)) {
		return res.errCode.req();
	}

	// 查询歌曲  valid=1表示需要更新播放量，valid=0表示不需要更新播放量
	let music = await GetMusic({ song_id, valid });
	// 判断该歌曲是否收费
	let ischarge = music.ischarge === 1;

	// 免费歌曲，直接发送二进制音频文件
	if (!ischarge) {
		let data = await downloadFn(music.song_name);
		return res.errCode.success({ filename: music.song_name, data });
	}

	// 收费歌曲

	// 判断用户是否登录，没有登录的话，拒绝该请求
	if (!ident) return res.errCode.refuse();

	// 已登录，查询用户是否已购买过该歌曲
	let state = await Ownership({ ident, song_id });
	if (!state) {
		// 未曾购买，拒绝请求
		return res.errCode.req();
	}

	let data = await downloadFn(music.song_name);

	res.errCode.success({ filename: music.song_name, data });
};

/**
 * 获取已购买的音乐
 */
exports.GetPurchased = async (req, res) => {
	let ident = req.ident;
	let result = await GetPurchased({ ident });

	if (result) {
		// 处理图片路径
		result.res.forEach((v) => {
			v.cover = `http://127.0.0.1:${port}/static/music/${v.song_name}/${v.cover}`;
		});

		res.errCode.success(result);
	} else {
		res.errCode.find();
	}
};

/**
 * 获取歌手
 */
exports.GetSinger = async (req, res) => {
	let { type, language } = req.query;

	// 判断传入的类型是否合法
	if (['recommend-singer', 'hot-singer'].includes(type) === false) {
		return res.errCode.req();
	}

	// 判断传入的语言选择是否合法
	if (
		['dl', 'om', 'rb', 'hg', 'other-country'].includes(language) === false
	) {
		return res.errCode.req();
	}

	// 执行查询
	let result = await GetSinger({ type, language });

	if (result) {
		result.res.forEach((v) => {
			v.cover = `http://127.0.0.1:${port}/static/music/${v.song_name}/${v.cover}`;
		});
		res.errCode.success(result);
	} else {
		res.errCode.find();
	}
};

/**
 * 删除歌曲
 */
exports.DelMusic = async (req, res) => {
	let ident = req.ident;

	let { id: song_id } = req.body;

	if (!song_id) return res.errCode.req();

	let result = await DelMusic({ ident, song_id });

	if (result) {
		res.errCode.success();
	} else {
		res.errCode.refuse();
	}
};

/**
 * 获取歌词
 */
exports.GetLyric = (req, res) => {
	let { song_name } = req.query;

	let song_path = `${path.join(
		audioSavePath,
		song_name,
		song_name + '.lrc'
	)}`;

	fs.readFile(song_path, 'utf8', (err, data) => {
		if (err) return res.errCode.find();
		res.errCode.success(data);
	});
};

/**
 * 搜索歌曲
 */
exports.SearchMusic = async (req, res) => {
	let { keyword } = req.query;

	let musics = await SearchMusic({ keyword });

	if (musics) {
		// 处理图片路径
		musics.res.forEach((v) => {
			v.cover = `http://127.0.0.1:${port}/static/music/${v.song_name}/${v.cover}`;
		});

		res.errCode.success(musics);
	} else {
		res.errCode.find();
	}
};

/**
 * 排行榜
 */
exports.GetRanklist = async (req, res) => {
	let { tt: rank_type, lt: song_language } = req.query;

	let musics = await GetRankingList({ rank_type, song_language });

	if (musics) {
		// 处理图片路径
		musics.res.forEach((v) => {
			v.cover = `http://127.0.0.1:${port}/static/music/${v.song_name}/${v.cover}`;
		});

		res.errCode.success(musics);
	} else {
		res.errCode.find();
	}
};

/**
 * 分类
 */
exports.ClassifiedSearch = async (req, res) => {
	let {
		song_style,
		song_language,
		sort_type,
		page_index,
		page_size,
	} = req.query;

	let musics = await ClassifiedSearch({
		song_style,
		song_language,
		sort_type,
		page_index,
		page_size,
	});

	if (musics) {
		// 处理图片路径
		musics.res.forEach((v) => {
			v.cover = `http://127.0.0.1:${port}/static/music/${v.song_name}/${v.cover}`;
		});

		res.errCode.success(musics);
	} else {
		res.errCode.find();
	}
};

/**
 * 举报
 */
exports.AddReport = async (req, res) => {
	let ident = req.ident;
	let { song_id, report_content } = req.body;
	let time = Date.now() + '';

	let state = await AddReport({
		ident,
		song_id,
		report_content,
		time,
	});

	if (state) {
		res.errCode.success();
	} else {
		res.errCode.req();
	}
};

/**
 * 更新听歌时长
 */
exports.UpdateListenSongDuration = async (req, res) => {
	let ident = req.ident;

	if (!ident) {
		return res.errCode.req();
	}

	let { duration, song_language } = req.body;

	// 转换为分钟
	duration = Number.parseInt(duration / 60);

	// 判断歌曲时长合法性,
	if (/^\d{1}$/.test(duration) === false || duration < 0 || duration > 10) {
		res.errCode.req();
	}

	// 判断歌曲类型合法性
	let languages = ['中文', '英文', '日语', '韩语', '粤语'];

	if (languages.includes(song_language) === false) {
		res.errCode.req();
	}

	setTimeout(async () => {
		let result = await UpdateListenSongDuration({
			ident,
			duration,
			song_language,
		});

		if (result) {
			res.errCode.success();
		} else {
			res.errCode.req();
		}
	}, 3000);
};
