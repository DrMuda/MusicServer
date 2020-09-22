const fs = require('fs');
const { join } = require('path');
// 导入支付宝sdk
const AlipaySdk = require('alipay-sdk').default;
// 导入支付宝表单
const AlipayFormData = require('alipay-sdk/lib/form').default;

// 私钥存放路径
const keyPath = join(__dirname, '../../config/pem/', 'private-key.pem');

// 获取音乐信息的方法
const { GetMusic } = require('../../model/Player');
// 操作数据库的方法
const mssql = require('../../libs/mssql');

module.exports = async (req, res) => {
    // 得到用户token
    let token = req.token;
    // 得到用户标识
    let ident = req.ident;
    // 获取用户提交的歌曲id
	let { song_id } = req.query;

	// 获取该歌曲价格
	let music = await GetMusic({ song_id });

	// 配置支付宝sdk
	const alipaySdk = new AlipaySdk({
		appId: '2016102300741578', // 应用id
		privateKey: fs.readFileSync(keyPath, 'ascii'), // 读取私钥的内容
		gateway: 'https://openapi.alipaydev.com/gateway.do', // 沙箱环境地址，线上环境可以不写
	});

    // 得到支付宝表单对象
	const formData = new AlipayFormData();

	// 定义支付配置
	let confData = {
		outTradeNo: `${Date.now()}${token.phone}${parseInt(
			Math.random() * 1000
		)}${song_id}`, // 订单号
		productCode: 'FAST_INSTANT_TRADE_PAY', // 固定，不能改
		totalAmount: music.price.toFixed(2), // 精确到小数点后2位
		subject: `歌曲名称：《${music.song_name}》`, // 商品标题
		body: '购买歌曲', // 商品描述，这个可以不写
	};

    // 支付链接的获取方式，get请求
    formData.setMethod('get');
    // 用户支付成功，并且支付宝收到后，用于通知支付结果的api接口地址
    formData.addField('notifyUrl', 'http://ph9ek2.natappfree.cc/paycallback'); // 回调地址必须为当前服务的线上地址！
    // 用户支付成功后，支付宝收银台需要跳转的页面地址
	formData.addField('returnUrl', 'http://ph9ek2.natappfree.cc/success');
    // 添加支付配置
	formData.addField('bizContent', confData);

    // 得到支付链接
	const result = await alipaySdk.exec(
		'alipay.trade.page.pay',
		{},
		{ formData: formData }
	);

	// 判断支付连接是否存在
	if (!result) return res.errCode.server();

    // 订单表插入数据的状态
	let insertState = false;
    
	// 插入订单信息至订单表
	try {
		insertState = await mssql.insert(
			{
				order_id: confData.outTradeNo, // 订单号
				ident, // 用户标识
				song_id, // 歌曲id
				payment_type: 0, // 支付方式，0表示支付宝
				time: Date.now() + '', // 下单时间，格式为13位时间戳
			},
			'OrderLog'
        );
        // 如果插入成功，则把状态值改为true
		if (insertState.rowsAffected[0] === 1) {
			insertState = true;
		}
	} catch (error) {
        // 如果插入的过程中失败，则把状态值改为false
		console.log('OrderLog数据插入失败', error);
		insertState = false;
	}

	// 判断是否插入成功
	if (insertState) {
		// 插入成功，返回支付链接
		res.errCode.success(result);
	} else {
		// 插入失败
		res.errCode.server();
	}
};
