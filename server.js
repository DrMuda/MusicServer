const express = require('express');
const bodyParser = require('body-parser');
const { join } = require('path');
const serverConf = require('./config/server');
const server = express();

// 跨域配置
server.use((req, res, next) => {
	console.log(req.path);
	// 设置是否运行客户端设置 withCredentials
	// 即在不同域名下发出的请求也可以携带 cookie
	res.header('Access-Control-Allow-Credentials', false);
	// 第二个参数表示允许跨域的域名，* 代表所有域名
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
	// 允许前台获得的除 Cache-Control、Content-Language、Content-Type、Expires、Last-Modified、Pragma 这几张基本响应头之外的响应头
	res.header(
		'Access-Control-Allow-Headers',
		'Content-Type, Authorization, Content-Length, X-Requested-With, responseType'
	);
	if (req.method == 'OPTIONS') {
		res.sendStatus(200);
	} else {
		next();
	}
});

// 错误码代理
server.use((req, res, next) => {
	let errCode = serverConf.errCode;
	res.errCode = new Proxy(errCode, {
		get(target, key) {
			console.log(`执行了错误码：${key}`);
			return target[key].bind(res);
		},
	});
	next();
});

// sql查询字段过滤
server.use((req, res, next) => {
	res.delCol = (result, filterArr) => {
		let newResult = JSON.parse(JSON.stringify(result));
		newResult.res.forEach((v, i) => {
			for (const key in v) {
				if (filterArr.includes(key)) {
					delete newResult.res[i][key];
				}
			}
		});
		return newResult;
	};
	next();
});

// 解析json
server.use(bodyParser.json());
// 解析文本
server.use(
	bodyParser.urlencoded({ extended: false, limit: serverConf.reqSize })
);
// 请求体大小
server.use(bodyParser.json({ limit: serverConf.reqSize }));

// 配置静态资源目录
server.use('/static', express.static(join(__dirname, serverConf.staticDir)));

// 设置路由
server.use(require('./controll/routers/index'));

// 监听端口
server.listen(serverConf.port, () => {
	console.log(`服务器运行于：127.0.0.1: ${serverConf.port}`);
});
