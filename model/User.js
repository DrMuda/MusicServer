// 用户模块
const mssql = require('../libs/mssql');

// 登录
const Login = async ({ phone, password }) => {
	let where = `where phone=@phone and pwd=@password`;

	try {
		let { recordset } = await mssql.select('users', 1, where, {
			phone,
			password,
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

// 注册
const Register = async (params) => {
	try {
		let res = await mssql.insert(params, 'users');

		if (res.rowsAffected[0] !== 1) return false;

		// 初始化语言表
		res = await mssql.insert({ ident: params.ident }, 'Languages');

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

// 检测用户是否存在
const UserExist = async ({ phone }) => {
	try {
		let { recordset } = await mssql.select(
			'users',
			1,
			'where phone=@phone',
			{ phone }
		);
		if (Array.isArray(recordset) && recordset.length > 0) {
			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 获取用户密保问题
const GetSecurity = async ({ ident }) => {
	let where = `where ident = @ident `;

	try {
		let { recordset } = await mssql.select('security', 1, where, {
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

// 获取我的评论
const GetComment = async ({ ident }) => {
	let where = `where ident=@ident`;
	try {
		let { recordset } = await mssql.select(
			'Comment',
			'',
			where,
			{ ident },
			'order by time desc'
		);
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

// 删除我的评论
const DelComment = async ({ ident, comment_id }) => {
	let where = `where ident=@ident and comment_id=@comment_id`;
	try {
		let { rowsAffected } = await mssql.del('Comment', where, {
			ident,
			comment_id,
		});
		if (rowsAffected[0] !== 0) {
			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.log(error);
		return false;
	}
};

// 修改个人信息
const UpdateInfo = async ({ ident, dataObj }) => {
	try {
		let res = await mssql.update(dataObj, { ident }, 'users');
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

// 修改密码
const ChangePassword = async ({ ident, password }) => {
	try {
		let res = await mssql.update({ pwd: password }, { ident }, 'users');
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

// 重置密码
const ResetPasswordValid = async ({
	phone,
	email,
	answer_one,
	answer_two,
	answer_three,
}) => {
	let sql = `
		select top(1) Users.ident
		from
		Users, Security
		where
		Users.phone = '${phone}'
		and
		Users.email = '${email}'
		and
		Users.ident = Security.ident
		and
		answer_one = '${answer_one}'
		and
		answer_two = '${answer_two}'
		and
		answer_three = '${answer_three}'
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

// 密保问题公开接口
const FindPublistSecurityQuestion = async ({ phone, email }) => {
	let sql = `
		select top(1) Security.*
		from Users,Security
		where
		Users.phone = @phone
		and
		Users.email = @email
		and
		Users.ident = Security.ident
	`;
	try {
		let { recordset } = await mssql.query(sql, { phone, email });
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

// 修改密保问题
const UpdateSecurityQuestion = async ({ ident, dataObj }) => {
	try {
		let res = await mssql.update(dataObj, { ident }, 'security');
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

module.exports = {
	Login,
	Register,
	UserExist,
	GetSecurity,
	GetComment,
	DelComment,
	UpdateInfo,
	ChangePassword,
	ResetPasswordValid,
	FindPublistSecurityQuestion,
	UpdateSecurityQuestion,
};
