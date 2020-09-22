/**
 * 歌曲评论处理
 */
const {
	GetComment,
	LikeComment,
	AddComment,
	AddReply,
} = require('../../model/Player');
const { port } = require('../../config/server');

/**
 * 获取评论
 */
exports.GetComment = async (req, res) => {
	let { song_id } = req.query;

	let result = await GetComment({ song_id });

	if (result) {
		// 处理图片路径
		result.latestComments.forEach((v) => {
			v.avatar = `http://127.0.0.1:${port}/static/avatar/${v.avatar}`;
		});
		result.wonderfulComments.forEach((v) => {
			v.avatar = `http://127.0.0.1:${port}/static/avatar/${v.avatar}`;
		});

		res.errCode.success(result);
	} else {
		res.errCode.find();
	}
};

/**
 * 添加评论
 */
exports.AddComment = async (req, res) => {
	let ident = req.ident;
	let { phone } = req.token;
	let { song_id, content } = req.body;

	let data = {
		ident,
		song_id,
		comment_id: `${Date.now()}${phone.slice(4)}`,
		comment_content: content,
		time: Date.now() + '',
	};

	let result = await AddComment(data);

	if (result) {
		res.errCode.success();
	} else {
		res.errCode.refuse();
	}
};

/**
 * 点赞评论
 */
exports.LikeComment = async (req, res) => {
	let ident = req.ident;
	let { comment_id } = req.body;

	let result = await LikeComment({ ident, comment_id });

	if (result) {
		res.errCode.success();
	} else {
		res.errCode.refuse();
	}
};

/**
 * 添加回复
 */
exports.AddReply = async (req, res) => {
	let ident = req.ident;
	let { phone } = req.token;
	let { song_id, comment_content, reply_username, reply_content } = req.body;
	let data = {
		ident,
		song_id,
		comment_id: `${Date.now()}${phone.slice(4)}`,
        comment_content,
        exist_reply: 1,
        reply_username,
        reply_content,
		time: Date.now() + '',
	};

	let result = await AddReply(data);

	if (result) {
		res.errCode.success();
	} else {
		res.errCode.refuse();
	}
};
