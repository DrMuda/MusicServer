const { GetComment, DelComment } = require('../../model/User');
const { DelMusic } = require('../../model/Player');

/**
 * 获取我的评论
 */
exports.GetComment = async (req, res) => {
	let ident = req.ident;

	let comment = await GetComment({ ident });

	if (comment) {
		comment = res.delCol(comment, ['ident']);
		res.errCode.success(comment);
	} else {
		res.errCode.find();
	}
};

/**
 * 删除我的评论
 */
exports.DelComment = async (req, res) => {
	let ident = req.ident;
	let { comment_id } = req.body;

	let state = await DelComment({ ident, comment_id });

	if (state) {
		res.errCode.success();
	} else {
		res.errCode.refuse();
	}
};
