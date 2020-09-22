module.exports = {
	user: 'sa',

	password: '123456',

	server: 'localhost',

    database: 'MusicApp',
    
    port: 1434,

	options: {
		trustedConnection: true,
		encrypt: false, // Windows Azure时设置为true，其他设置为false
		enableArithAbort: true
	},

	pool: {
		max: 10,

		min: 0,

		idleTimeoutMillis: 30000,
	},
};
