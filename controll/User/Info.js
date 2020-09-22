const fs = require('fs');
const path = require('path');
const SparkMD5 = require('spark-md5');
const { upload, port } = require('../../config/server');
const {
	ChangePassword,
	GetSecurity,
	FindPublistSecurityQuestion,
	ResetPasswordValid,
	UpdateSecurityQuestion,
	UpdateInfo,
} = require('../../model/User');
const crypto = require('../../libs/Crypto');
const DataTest = require('../../libs/DataTest');
const test = new DataTest();

/**
 * 更新用户信息
 */
exports.UpdateInfo = async (req, res) => {
	let token = req.token;
	let ident = req.ident;

	let { avatarFile: avatar, securityQuestion, userinfo } = req.body;

	let { username, sex, email, signature } = userinfo;

	let info = {};

	// 判断用户名长度
	if (test.len(username, 1, 15)) info.username = username;
	// 判断头像路径是否存在
	if (!!avatar) info.avatar = avatar;
	// 判断性别是否存在
	if (test.sex(sex, 1)) info.sex = sex;
	// 判断邮箱是否存在
	if (test.email(email)) info.email = email;
	// 判断签名是否存在
	if (test.len(signature) > 0) info.signature = signature;
	// 更新个人信息
	let UserInfoState = await UpdateInfo({ ident, dataObj: info });

	// ----------------------------------------------------------------------->

	// 更新密保问题
	let answerObj = {};

	securityQuestion.forEach((v, i) => {
		if (!v.answer.trim()) return;
		switch (i) {
			case 0:
				answerObj.question_one = v.id;
				answerObj.answer_one = v.answer;
				break;
			case 1:
				answerObj.question_two = v.id;
				answerObj.answer_two = v.answer;
				break;
			case 2:
				answerObj.question_three = v.id;
				answerObj.answer_three = v.answer;
				break;
		}
	});

	// 默认是没有更新密保问题的
	let SecurityState = false;
	// 判断用户是否填写密保答案，填写则更新，否则不更新密保问题
	if (Object.keys(answerObj).length / 2 >= 1) {
		// 能进来这里，代表要更新密保问题，更新成功，则 SecurityState=true，否则 SecurityState = false
		SecurityState = await UpdateSecurityQuestion({
			ident,
			dataObj: answerObj,
		});
	}

	// 删除不需要的token字段
	delete token.expire;
	delete token.iat;
	delete token.ident;

	// 合并token中存储的信息
	userinfo = Object.assign(token, info);

	// 修改图片地址
	userinfo.avatar = `http://127.0.0.1:${port}/static/avatar/${userinfo.avatar}`;

	// 返回状态
	res.errCode.success({
		UserInfoState,
		SecurityState,
		userinfo,
	});
};

/**
 * 更改密码
 */
exports.ChangePassword = async (req, res) => {
	// 取出用户传递的密码
	let { newPassword, confirmPassword } = req.body;

	// 判断密码格式
	if (!test.password(newPassword, { minLen: 64, maxLen: 64 }))
		return res.errCode.refuse('您的密码被恶意拦截，请更换浏览器！');

	// 判断两次密码一致性
	if (newPassword !== confirmPassword)
		return res.errCode.req('两次输入的密码不一致');

	// 对密码二次加密
	let password = crypto.createHash(newPassword);
	// 取出用户标识
	let ident = req.ident;
	// 执行更新
	let state = await ChangePassword({ ident, password });
	// 判断更新成功或失败
	if (state) {
		res.errCode.success();
	} else {
		res.errCode.server();
	}
};

/**
 * 重置密码
 */
exports.ResetPassword = async (req, res) => {
	let { phone, email, selectQuestion } = req.body;
	if (!test.phone(phone)) return res.errCode.req();
	if (!test.email(email)) return res.errCode.req();
	if (!(Array.isArray(selectQuestion) && selectQuestion.length === 3))
		return res.errCode.req();

	// 定义密保问题的字段标识
	let keys = ['question_one', 'question_two', 'question_three'];

	// 定义用户所选答案集合
	let answer = {};

	try {
		// 遍历用户提交的问题答案数据
		for (let i = 0; i < selectQuestion.length; i++) {
			// 判断用户提交的数据是否属于密保问题字段的标识，并且判断答案是否是有效值
			if (
				keys.includes(selectQuestion[i].key) &&
				!!selectQuestion[i].answer
			) {
				// 将答案添加至集合，并对字段重命名
				answer[selectQuestion[i].key.replace('question', 'answer')] =
					selectQuestion[i].answer;
			} else {
				throw new Error('参数不正确');
			}
		}
	} catch (error) {
		console.log(error);
		return res.errCode.req();
	}

	// 查询该用户信息是否正确
	let result = await ResetPasswordValid({ phone, email, ...answer });

	// 判断查询到的信息是否为空
	if (result === false) return res.errCode.req();

	// 重置密码
	let state = await ChangePassword({
		ident: result.res[0].ident,
		password: crypto.cryptoPassword(phone, '123456'),
	});

	// 判断更新成功或失败
	if (state) {
		res.errCode.success();
	} else {
		res.errCode.server();
	}
};

/**
 * 上传头像
 */
exports.UploadAvatar = (req, res) => {
	// 得到文件数据和文件名
	let { fileData, filename } = req.body;
	// 解码
	fileData = decodeURIComponent(fileData);
	// 删除base64声明
	fileData = fileData.replace(/^data:image\/\w+;base64,/, '');
	// 转换为Buffer
	fileData = Buffer.from(fileData, 'base64');
	// 得到Spark实例
	let spark = new SparkMD5.ArrayBuffer();
	// 取得文件后缀名
	let suffix = /\.([0-9a-zA-Z]+)$/.exec(filename)[1];
	// 将Buffer数据添加至Spark
	spark.append(fileData);
	// 设置服务器根路径
	let rootPath = path.join(__dirname, '../../');
	// 对图片文件重命名
	let rename = `${spark.end()}.${suffix}`;
	// 图片的保存路径
	let filepath = `${rootPath}${upload.saveDir}${rename}`;
	// 写入文件
	fs.writeFileSync(filepath, fileData);
	// 返回相关信息
	res.errCode.success({
		filename,
		rename,
		filepath: filepath.replace(rootPath, `http://127.0.0.1:${port}`),
	});
};

/**
 * 获取密保问题
 */
exports.GetSecurity = async (req, res) => {
	let ident = req.ident;
	let result = await GetSecurity({ ident });
	result = res.delCol(result, [
		'ident',
		'answer_one',
		'answer_two',
		'answer_three',
	]);
	res.errCode.success(result);
};

/**
 * 通过公共接口获取密保问题
 */
exports.FindPublistSecurityQuestion = async (req, res) => {
	let { phone, email } = req.body;

	if (!test.phone(phone)) return res.errCode.req();
	if (!test.email(email)) return res.errCode.req();

	let result = await FindPublistSecurityQuestion({ phone, email });

	if (result === false) return res.errCode.req();

	result = res.delCol(result, [
		'ident',
		'answer_one',
		'answer_two',
		'answer_three',
	]);

	result = result.res[0];

	let newResult = [];

	for (const key in result) {
		newResult.push({
			id: result[key],
			key,
			answer: '',
		});
	}

	res.errCode.success(newResult);
};
