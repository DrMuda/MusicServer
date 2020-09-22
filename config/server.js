const path = require('path');

module.exports = {
	// 服务器端口
	port: 3000,
	// 请求体大小
	reqSize: '5mb',
	// 静态资源目录
	staticDir: 'static',
	// 文件上传配置
	upload: {
		flag: true, // 启用文件上传
		saveDir: '/static/avatar/', // 文件保存目录
		imgNodeName: 'picture', // 图片上传节点名称
		imgCount: 1, // 一次最多上传5张图片
	},
	// 音频存放路径
	audioSavePath: path.resolve(__dirname, '../static/music/'),

	token: {
		userSign: '用户签名',
		adminSign: '管理员签名',
		expire: 3 * 60 * 60 * 1000, // 3天后过期
	},

	// 错误码
	errCode: {
		// 成功
		success(msg = 'ok') {
			this.send({
				code: 200,
				msg,
			});
		},
		// 请求参数错误
		req(msg = '非法请求') {
			this.send({
				code: 400,
				msg,
			});
		},
		//
		iden(msg = '身份未认证') {
			this.send({
				code: 401,
				msg,
			});
		},
		//
		refuse(msg = '拒绝请求') {
			this.send({
				code: 403,
				msg,
			});
		},
		//
		find(msg = '资源不存在') {
			this.send({
				code: 404,
				msg,
			});
		},
		//
		server(msg = '网络错误') {
			this.send({
				code: 500,
				msg,
			});
		},
	},
};
