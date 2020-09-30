module.exports = {
	user: 'sa', // 数据库用户名

	password: '123456', // 密码

	server: 'localhost', // 本地服务器

    database: 'MusicApp', // 数据库名称
    
	port: 50898, // SQL Server 端口号
	
	retryTimes: 5, // 失败重连次数

	options: {
		trustedConnection: true,
		encrypt: false, // Windows Azure时设置为true，其他设置为false
		enableArithAbort: true
	},

	pool: {
		max: 1024,

		min: 0,

		idleTimeoutMillis: 30000,
	},
};


/**
 * 查询数据库端口的方法
 * exec sys.sp_readerrorlog 0, 1, 'listening'
 */