// 用户模块
const mssql = require('../libs/mssql');

// 首页分类
const home_recommend_type = {
	0: '',
	1: `where song_language = '中文' or song_language = '粤语'`,
	2: `where song_language = '英文'`,
	3: `where song_language = '日语'`,
	4: `where song_language = '韩语'`,
};

// 排行榜排序规则映射
let rank_type_map = new Map([
	[
		'推荐榜',
		`playback_times desc, collection_count desc, comment_count desc, time desc`,
	],
	[
		'飙升榜',
		`time desc, collection_count desc, comment_count desc, playback_times desc`,
	],
	['新歌榜', 'time desc,  playback_times desc, comment_count desc'],
]);

// 排行榜语种规则映射
let language_map = new Map([
	['中文榜', `中文`],
	['英文榜', `英文`],
	['日语榜', '日语'],
	['韩语榜', '韩语'],
	['粤语榜', '粤语'],
]);

// 歌单排序类型规则映射
let playlist_map = new Map([
	['综合排序', `order by playback_times desc, time desc`],
	['最新', `order by time desc`],
	['最热', 'order by playback_times desc'],
	['中系', 'and tags = 0 order by playback_times desc, time desc'],
	['英系', 'and tags = 1 order by playback_times desc, time desc'],
	['日系', 'and tags = 2 order by playback_times desc, time desc'],
	['韩系', 'and tags = 3 order by playback_times desc, time desc'],
	['粤系', 'and tags = 4 order by playback_times desc, time desc'],
]);

// 歌手推荐规则映射
let singer_recommend_map = new Map([
	[
		'recommend-singer',
		`order by comment_count desc, collection_count desc, playback_times desc`,
	],
	['hot-singer', `order by playback_times desc, comment_count desc`],
]);

// 歌手语种规则映射
let singer_language_map = new Map([
	['dl', `中文`],
	['om', `英文`],
	['rb', '日语'],
	['hg', '韩语'],
	['other-country', '粤语'],
]);

// 分类排序类型规则映射
let classified_map = new Map([
	[
		'综合排序',
		`order by collection_count desc, comment_count desc, playback_times desc, song_id`,
	],
	[
		'最新',
		`order by time desc, collection_count desc, comment_count desc, song_id`,
	],
	[
		'最热',
		'order by playback_times desc, comment_count desc, collection_count desc, song_id',
	],
	['最多评论', 'order by comment_count desc, collection_count desc, song_id'],
]);

// 听歌类型规则映射
let listen_song_language_map = new Map([
	['中文', 'Chinese_count'],
	['英文', 'Japanese_count'],
	['日语', 'English_count'],
	['韩语', 'Korean_count'],
	['粤语', 'Cantonese_count'],
	['其他', 'other_language'],
]);

// -------------------------------------------------------------------------------------------------->
// 获取首页推荐歌曲
const GetHomeRecommend = async ({ index, type }) => {
	let sql = `
			select * from Song
			${home_recommend_type[type]}
			order by playback_times desc, comment_count desc, collection_count desc
			offset ${index * 5} rows 
			fetch next 5 rows only
	`;

	try {
		let { recordset } = await mssql.query(sql);
		if (Array.isArray(recordset) && recordset.length > 0) {
			return {
				res: recordset,
				count: recordset.length,
			};
		}
		return false;
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 获取首页新歌推荐
const GetHomeNewSong = async ({ index, type }) => {
	let sql = `
			select * from Song
			${home_recommend_type[type]}
			order by playback_times desc, comment_count desc, collection_count desc, time desc
			offset ${index * 10} rows 
			fetch next 10 rows only
	`;

	try {
		let { recordset } = await mssql.query(sql);
		if (Array.isArray(recordset) && recordset.length > 0) {
			return {
				res: recordset,
				count: recordset.length,
			};
		}
		return false;
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 获取首页五大排行榜
const GetHomeRankingList = async () => {
	let sql = `
		begin
			-- 热歌
			select top(3) * from Song
			order by playback_times desc, comment_count desc
			-- 新歌
			select top(3) * from Song
			order by comment_count desc, playback_times desc, time desc
			-- 欧美
			select top(3) * from Song
			where song_language = '英文'
			order by playback_times desc, comment_count desc
			-- 日韩
			select top(3) * from Song
			where song_language = '日语' or song_language = '韩语'
			order by playback_times desc, comment_count desc
			-- 中文-粤语
			select top(3) * from Song
			where song_language = '中文' or song_language = '粤语'
			order by playback_times desc, comment_count desc
		end
	`;

	try {
		let { recordsets } = await mssql.query(sql);
		if (Array.isArray(recordsets) && recordsets.length === 5) {
			return {
				res: recordsets,
				count: recordsets.length,
			};
		}
		return false;
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 获取歌曲
const GetMusic = async ({ song_id, valid }) => {
	let where = `where song_id=@song_id`;

	// 更新歌曲播放量
	let updateSQL = `
		update Song
		set playback_times = playback_times + 1
		where song_id = '${song_id}';
	`;

	try {
		let { recordset } = await mssql.select('Song', 1, where, { song_id });

		if (Array.isArray(recordset) && recordset.length <= 0) {
			return false;
		}

		// 不需要更新
		if (valid === 0) {
			return recordset[0];
		}

		// 需要更新播放量
		let res = await mssql.query(updateSQL);

		if (res.rowsAffected[0] === 1) {
			return recordset[0];
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 获取已购买的音乐
const GetPurchased = async ({ ident }) => {
	let sql = `
			select Song.*
			from
			Song, OrderLog
			where
			OrderLog.ident = '${ident}'
			and
			OrderLog.song_id = Song.song_id
			order by OrderLog.time desc;
	`;

	try {
		let { recordset } = await mssql.query(sql);
		if (Array.isArray(recordset) && recordset.length > 0) {
			return {
				res: recordset,
				count: recordset.length,
			};
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 获取歌手
const GetSinger = async ({ type, language }) => {
	let sql = `
			select distinct singer_name FROM (

					select *,

					ROW_NUMBER() 

					over(partition by singer_name ${singer_recommend_map.get(type)}) 

					AS len from Song 
			) 

			AS field_data WHERE field_data.song_language = '${singer_language_map.get(
				language
			)}'
	`;

	try {
		let { recordset } = await mssql.query(sql);
		if (Array.isArray(recordset) && recordset.length > 0) {
			return {
				res: recordset,
				count: recordset.length,
			};
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 判断用户是否拥有歌曲的所有权
const Ownership = async ({ ident, song_id }) => {
	let sql = `
		select top(1) count(*) as exist
		from OrderLog
		where
		ident = '${ident}'
		and
		song_id = '${song_id}'
	`;

	try {
		let { recordset } = await mssql.query(sql);
		if (Array.isArray(recordset) && recordset.length === 1) {
			return recordset.exist > 0;
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 删除歌曲
const DelMusic = async ({ ident, song_id }) => {

	let sql = `
		delete t1
		from UserSongStore as t1
		inner join
		Playlist as t2
		on
		t1.playlist_id = t2.playlist_id
		and
		t1.ident = @ident
		and
		t1.song_id = @song_id
		and
		t2.playlist_name = '我喜欢'
	`

	try {
		let { rowsAffected } = await mssql.query(sql, {
			ident,
			song_id,
		});

		if (Array.isArray(rowsAffected)) {
			return rowsAffected > 0;
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 搜索歌曲
const SearchMusic = async ({ keyword }) => {
	let sql = `
		select * from Song
		${
			keyword
				? `
			where
			(
				song_name like '%${keyword}%'
				or
				singer_name like '%${keyword}%'
			)
			`
				: ``
		}
		order by
		playback_times desc,
		collection_count desc,
		comment_count desc,
		time desc
	`;

	try {
		let { recordset } = await mssql.query(sql);
		if (Array.isArray(recordset) && recordset.length > 0) {
			return {
				res: recordset,
				count: recordset.length,
			};
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 获取歌曲排行榜
const GetRankingList = async ({
	rank_type = '推荐榜',
	song_language = '中文',
}) => {
	let sql = `
			select * from Song
			${
				language_map.get(song_language)
					? `where song_language = '${language_map.get(
							song_language
					  )}'`
					: ``
			}
			order by
			${rank_type_map.get(rank_type)}
		`;

	try {
		let { recordset } = await mssql.query(sql);
		if (Array.isArray(recordset) && recordset.length > 0) {
			return {
				res: recordset,
				count: recordset.length,
			};
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 分类搜索
const ClassifiedSearch = async ({
	song_style,
	song_language,
	sort_type,
	page_index,
	page_size,
}) => {
	let sizeSQL = `
		select count(song_id) as size from song
		where
		song_style = '${song_style}'
		and
		song_language = '${song_language}'
	`;

	let findSQL = `
		select * from song
		where
		song_style = '${song_style}'
		and
		song_language = '${song_language}'
		${classified_map.get(sort_type)}
		offset ${(page_index - 1) * page_size} rows 
		fetch next ${page_size} rows only
	`;

	try {
		let dataSize = await mssql.query(sizeSQL);
		let { recordset } = await mssql.query(findSQL);
		if (Array.isArray(recordset) && recordset.length > 0) {
			return {
				res: recordset,
				count: recordset.length,
				size: dataSize.recordset[0].size,
			};
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 获取歌词
const GetLyric = async ({ lyric_id }) => {
	let where = `where lyric_id=@lyric_id`;
	try {
		let res = await mssql.select('Lyric', '', where, { lyric_id });
		if (res) {
			return res;
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 获取歌曲评论
const GetComment = async ({ song_id }) => {
	let th = `
			users.username, 
			users.avatar, 
			comment.comment_id, 
			comment.song_id, 
			comment.comment_content, 
			comment.likes, 
			comment.time, 
			comment.exist_reply,
			comment.reply_username,
			comment.reply_content
		`;
	let table = `comment, users`;
	let where = `where comment.song_id='${song_id}' and comment.ident = users.ident`;
	try {
		// 查询最新评论

		let latestCommentsSQL = `
			select ${th}
			from ${table}
			${where}
			order by time desc
		`;

		let latestComments = await mssql.query(latestCommentsSQL);

		// 如果查询结果不存在，则退出
		if (
			!(
				Array.isArray(latestComments.recordset) &&
				latestComments.recordset.length > 0
			)
		) {
			return false;
		}

		// 计算精彩评论的数量
		let wonderfulCommentsLen = Math.ceil(
			latestComments.recordset.length * 0.1
		);

		// 查询精彩评论
		let wonderfulCommentSQL = `
			select top(${wonderfulCommentsLen}) ${th}
			from ${table}
			${where}
			order by likes desc
		`;

		let wonderfulComments = await mssql.query(wonderfulCommentSQL);

		if (
			Array.isArray(wonderfulComments.recordset) &&
			wonderfulComments.recordset.length > 0
		) {
			return {
				latestComments: latestComments.recordset,
				wonderfulComments: wonderfulComments.recordset,
				count: latestComments.recordset.length,
			};
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 添加歌曲评论
const AddComment = async ({
	ident,
	comment_id,
	song_id,
	comment_content,
	time,
}) => {
	try {
		// 插入评论
		let res = await mssql.insert(
			{ ident, comment_id, song_id, comment_content, time },
			'Comment'
		);
		// 更新歌曲评论数
		let updateSQL = `
			update Song
			set comment_count = comment_count + 1
			where song_id = '${song_id}';
		`;

		if (res.rowsAffected[0] === 1) {
			res = await mssql.query(updateSQL);
		}

		if (res.rowsAffected[0] === 1) {
			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 点赞评论
const LikeComment = async ({ ident, comment_id }) => {
	// 先查询该用户是否已经对该条评论进行点赞，如果已经点赞过，则不进行任何操作
	let likeExistSQL = `
		select count(1) as exist from likes where ident = '${ident}' and comment_id='${comment_id}'
	`;

	let isExist = await mssql.query(likeExistSQL);

	if (isExist.recordset[0].exist > 0) return false;

	// 插入新记录
	let insertData = {
		comment_id,
		ident,
		time: Date.now() + '',
	};
	// 执行插入
	let insertState = await mssql.insert(insertData, 'likes');
	// 判断是否插入成功
	if (insertState.rowsAffected[0] !== 1) return false;

	// 没有点赞过，则执行点赞操作
	let sql = `
        update Comment
        set likes = likes + 1
        where comment_id = @comment_id
    `;
	try {
		let res = await mssql.query(sql, { comment_id });
		if (res.rowsAffected[0] === 1) {
			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 添加回复
const AddReply = async ({
	ident,
	comment_id,
	song_id,
	comment_content,
	exist_reply,
	reply_username,
	reply_content,
	time,
}) => {
	try {
		let res = await mssql.insert(
			{
				ident,
				comment_id,
				song_id,
				comment_content,
				exist_reply,
				reply_username,
				reply_content,
				time,
			},
			'Comment'
		);

		// 更新歌曲评论数
		let updateSQL = `
			update Song
			set comment_count = comment_count + 1
			where song_id = '${song_id}';
		`;

		if (res.rowsAffected[0] === 1) {
			res = await mssql.query(updateSQL);
		}

		if (res.rowsAffected[0] === 1) {
			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 举报歌曲
const AddReport = async ({ ident, song_id, report_content, time }) => {
	try {
		let res = await mssql.insert(
			{
				ident,
				song_id,
				report_content,
				time,
			},
			'Report'
		);
		if (res.rowsAffected[0] === 1) {
			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 获取公开歌单
const GetPublicPlaylist = async ({
	search_type,
	page_index = 0,
	page_size = 20,
}) => {
	// 拼接查询
	let where = `
			where 
			secret = 0 
			and 
			playlist_name <> '我喜欢' 
			${playlist_map.get(search_type)} 
		`;
	// 拼接分页
	where += `
			offset ${(page_index - 1) * page_size} rows 
			fetch next ${page_size} rows only
		`;

	try {
		let dataSize = await mssql.query(
			`select count(playlist_id) as size from playlist where playlist_name <> '我喜欢'`
		);
		let { recordset } = await mssql.select('Playlist', '', where);
		if (Array.isArray(recordset) && recordset.length > 0) {
			return {
				res: recordset,
				count: recordset.length,
				size: dataSize.recordset[0].size,
			};
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 获取私有歌单
const GetPrivatePlaylist = async ({ ident }) => {
	let where = `where ident=@ident`;

	try {
		let { recordset } = await mssql.select('Playlist', '', where, {
			ident,
		});
		if (Array.isArray(recordset) && recordset.length > 0) {
			return {
				res: recordset,
				count: recordset.length,
			};
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 获取公开歌单歌曲
const GetPublicPlaylistMusic = async ({ playlist_id }) => {
	let sql = `
        select 
        Song.song_id,
        Song.song_language,
        Song.song_style,
        Song.cover,
        Song.song_name,
        Song.singer_name,
        Song.lyric_id,
        Song.playback_times,
        Song.collection_count,
        Song.comment_count,
        Song.ischarge,
        Song.price,
        Song.time
        -----------------------------------------------
        from
        Playlist, UserSongStore, Song
        where
        Playlist.playlist_id = @playlist_id
        and
        Playlist.secret = 0
        and
        UserSongStore.playlist_id = Playlist.playlist_id
        and
        UserSongStore.song_id = Song.song_id
    `;

	try {
		let { recordset } = await mssql.query(sql, { playlist_id });
		if (Array.isArray(recordset) && recordset.length > 0) {
			return {
				res: recordset,
				count: recordset.length,
			};
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 获取私有歌单歌曲
const GetPrivatePlaylistMusic = async ({ ident, playlist_id }) => {
	let sql = `
        select 
        Song.song_id,
        Song.song_language,
        Song.song_style,
        Song.cover,
        Song.song_name,
        Song.singer_name,
        Song.lyric_id,
        Song.playback_times,
        Song.collection_count,
        Song.comment_count,
        Song.ischarge,
        Song.price,
        Song.time
        -----------------------------------------------
        from
        Playlist, UserSongStore, Song
        where
        Playlist.ident = @ident
        and
        Playlist.playlist_id = @playlist_id
        and
        UserSongStore.playlist_id = Playlist.playlist_id
        and
		UserSongStore.song_id = Song.song_id
		order by Song.time desc
    `;

	try {
		let { recordset } = await mssql.query(sql, { ident, playlist_id });
		if (Array.isArray(recordset) && recordset.length > 0) {
			return {
				res: recordset,
				count: recordset.length,
			};
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 获取“我喜欢”的歌曲
const GetLikeMusics = async ({ ident }) => {
	let sql = `
	select 
	Song.song_id,
	Song.song_language,
	Song.song_style,
	Song.cover,
	Song.song_name,
	Song.singer_name,
	Song.lyric_id,
	Song.playback_times,
	Song.collection_count,
	Song.comment_count,
	Song.ischarge,
	Song.price,
	Song.time
	-----------------------------------------------
	from
	Playlist, UserSongStore, Song
	where
	Playlist.ident = @ident
	and
	Playlist.playlist_name = '我喜欢'
	and
	UserSongStore.playlist_id = Playlist.playlist_id
	and
	UserSongStore.song_id = Song.song_id
`;

	try {
		let { recordset } = await mssql.query(sql, { ident });
		if (Array.isArray(recordset) && recordset.length > 0) {
			return {
				res: recordset,
				count: recordset.length,
			};
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 新建歌单
const CreatePlaylist = async ({ playlist_id, ident, playlist_name, time }) => {
	try {
		let { rowsAffected } = await mssql.insert(
			{ playlist_id, ident, playlist_name, time },
			'Playlist'
		);
		if (rowsAffected[0] === 1) {
			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 添加至歌单
const MusicToPlaylist = async ({ ident, song_id, playlist_id, time }) => {
	try {
		let res = await mssql.insert(
			{ ident, song_id, playlist_id, time },
			'UserSongStore'
		);

		if (res.rowsAffected[0] === 1) {
			res = true;
		} else {
			res = false;
		}

		if (!res) return false;

		let updateSQL = `
			update Playlist
			set song_count = song_count + 1, cover = (select top(1) cover from Song where song_id = @song_id)
			where
			playlist_id = @playlist_id
		`;

		res = await mssql.query(updateSQL, { playlist_id, song_id });
		if (res.rowsAffected[0] === 1) {
			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 删除歌单
const DelPlaylist = async ({ ident, playlist_id }) => {
	let where = `where ident=@ident and playlist_id=@playlist_id and playlist_name <> '我喜欢'`;
	try {
		let { rowsAffected } = await mssql.del('Playlist', where, {
			ident,
			playlist_id,
		});
		if (rowsAffected[0] === 1) {
			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 编辑歌单
const EditPlaylist = async ({
	ident,
	playlist_id,
	playlist_name,
	tags,
	secret,
}) => {
	try {
		let res = await mssql.update(
			{ playlist_name, tags, secret },
			{ playlist_id, ident },
			'Playlist'
		);
		if (res.rowsAffected[0] === 1) {
			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 保存歌单
const SavePlaylist = async ({
	ident,
	playlist_id,
	playlist,
	playlist_name,
	time,
}) => {
	// 创建歌单
	let createState = await CreatePlaylist({
		playlist_id,
		ident,
		playlist_name,
		time,
	});
	// 创建失败则返回
	if (!createState) return false;

	// 拼接数据
	let data = playlist.map((v) => {
		return `( '${ident}', '${v}', '${playlist_id}', '${time}')`;
	});

	// 拼接sql
	let insertSQL = `
			insert into UserSongStore
			(ident, song_id, playlist_id, time)
			values
			${data.join(',')}
		`;
	// 删除最后一个逗号
	insertSQL = insertSQL.slice(0, insertSQL.length - 1);

	// 更新歌曲数量
	let = updateSQL = `
			update Playlist
			set song_count = song_count + ${playlist.length}
			where
			playlist_id = @playlist_id
		`;
	// 执行歌曲插入
	try {
		let res = await mssql.query(insertSQL, { ident });

		if (res.rowsAffected[0] !== playlist.length) return false;

		res = await mssql.query(updateSQL, { playlist_id });

		if (res.rowsAffected[0] === 1) {
			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 获取分享的歌曲或歌单
const GetShareMusicList = async ({ key, val, isPlaylist }) => {
	let sql = '';
	let result = '';

	if (isPlaylist) {
		result = await GetPublistPlaylistMusic({ playlist_id: val });
		return result;
	} else {
		sql = `
			select * from Song
			where song_id = @song_id
		`;
	}

	try {
		let { recordset } = await mssql.query(sql, { song_id: val });
		if (Array.isArray(recordset) && recordset.length > 0) {
			return {
				res: recordset,
				count: recordset.length,
			};
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 更新听歌时长
const UpdateListenSongDuration = async ({ ident, duration, song_language }) => {
	let key = listen_song_language_map.get(song_language);
	console.log('------------------------------------>', duration);
	let sql = `
		begin transaction update_duration
			declare @errorCount int = 0; -- 事物执行过程中发生错误的个数
			
			begin try
					-- 更新歌曲时长
					update Users
					set listening_song_duration = listening_song_duration + @duration
					where ident = @ident;
					set @errorCount = @errorCount + @@error;
					
					-- 更新听歌类型
					update Languages
					set ${key} = ${key} + 1
					where ident = @ident;
					set @errorCount = @errorCount + @@error;
				
			end try
			begin catch
				select 
					error_number() errorNumber,
					error_severity() errorSeverity,
					error_procedure() errorProcedure,
					error_line() errorLine,
					error_message() errorMessage
				
				if(@@trancount>0)
				begin
					rollback transaction update_duration;
				end
			end catch
			
			if(@@trancount>0)
			begin
				commit transaction update_duration
			end
	`;

	try {
		let res = await mssql.query(sql, { ident, duration });
		// [1, 1, 1, 1, 1]
		if (res.rowsAffected.includes(0) === false) {
			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

module.exports = {
	GetHomeRecommend,
	GetHomeNewSong,
	GetHomeRankingList,
	GetMusic,
	GetPurchased,
	GetSinger,
	Ownership,
	DelMusic,
	SearchMusic,
	GetRankingList,
	ClassifiedSearch,
	GetLyric,
	GetComment,
	AddComment,
	LikeComment,
	AddReply,
	AddReport,
	GetPublicPlaylist,
	GetPrivatePlaylist,
	GetPublicPlaylistMusic,
	GetPrivatePlaylistMusic,
	GetLikeMusics,
	CreatePlaylist,
	MusicToPlaylist,
	DelPlaylist,
	EditPlaylist,
	SavePlaylist,
	GetShareMusicList,
	UpdateListenSongDuration,
};
