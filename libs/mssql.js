const mssql = require('mssql');
const config = require('../config/db');

class Sql {
	constructor() {
		this.connect = null; // 数据库实例
		// 连接数据库
		this.init();
	}

	init() {
		this.connectDB();
	}

	/**
	 * 连接数据库
	 */
	connectDB() {
		this.connect = new mssql.ConnectionPool(config);

		// 监听初始化
		this.connect.on('error', (err) => {
			if (err) {
				console.log('数据库初始化失败');
				this.connect = null;
				throw err;
			}
		});

		// 监听数据库连接
		this.connect.connect((err) => {
			if (err) {
				console.log('数据库连接失败');
				this.connect = null;
				throw err;
			}
			console.log('数据库连接成功！');
		});
	}

	// 执行sql语句
	/**
	 *
	 * @param {string} sql sql语句
	 * @param {object} params 需要注入的参数
	 */
	query(sql, params) {
		let db = new mssql.PreparedStatement(this.connect);
		// 注入变量
		if (params && Object.keys(params).length > 0) {
			for (const key in params) {
				// 判断参数类型
				let type = typeof params[key];
				switch (type) {
					case 'number':
						db.input(key, mssql.Int);
						break;
					case 'string':
						db.input(key, mssql.VarChar);
						break;
				}
			}
		}
		console.log('query语句：', sql);
		// 语句准备
		return new Promise((resolve, reject) => {
			// 创建连接
			db.prepare(sql, (err) => {
				if (err) reject(err);
				// 执行并注入参数
				db.execute(params, (err, result) => {
					if (err) reject(err);
					// 释放连接
					db.unprepare((err) => {
						if (err) reject(err);
						// 返回数据
						resolve(result);
					});
				});
			});
		});
	}

	// select 语句
	/**
	 *
	 * @param {string} tableName 表名
	 * @param {number} topNumber 查询多少条数据
	 * @param {string} whereSql where条件语句
	 * @param {object} params 需要注入的参数
	 * @param {string} orderSql 排序语句
	 */
	select(tableName, topNumber, whereSql = '', params, orderSql = '') {
		let db = new mssql.PreparedStatement(this.connect);
		let sql = `select * from ${tableName} `;
		if (topNumber && typeof topNumber === 'number') {
			sql = `select top(${topNumber}) * from ${tableName} `;
		}
		// 拼接条件语句
		sql += whereSql + ' ';
		// 注入变量
		if (params && Object.keys(params).length > 0) {
			for (const key in params) {
				// 判断参数类型
				let type = typeof params[key];
				switch (type) {
					case 'number':
						db.input(key, mssql.Int);
						break;
					case 'string':
						db.input(key, mssql.VarChar);
						break;
				}
			}
		}
		// 拼接条件语句
		sql += ' ' + orderSql;
		console.log('select语句：', sql);
		// 语句准备
		return new Promise((resolve, reject) => {
			// 创建连接
			db.prepare(sql, (err) => {
				if (err) reject(err);
				// 执行并注入参数
				db.execute(params, (err, result) => {
					if (err) reject(err);
					// 释放连接
					db.unprepare((err) => {
						if (err) reject(err);
						// 返回数据
						resolve(result);
					});
				});
			});
		});
	}

	// select查询所有
	/**
	 *
	 * @param {string} tableName 表名
	 */
	selectAll(tableName) {
		let db = new mssql.PreparedStatement(this.connect);
		let sql = `select * from ${tableName}`;
		console.log('selectAll语句：', sql);
		// 语句准备
		return new Promise((resolve, reject) => {
			// 创建连接
			db.prepare(sql, (err) => {
				if (err) reject(err);
				// 执行并注入参数
				db.execute(params, (err, result) => {
					if (err) reject(err);
					// 释放连接
					db.unprepare((err) => {
						if (err) reject(err);
						// 返回数据
						resolve(result);
					});
				});
			});
		});
	}

	// insert 插入
	/**
	 *
	 * @param {object} dataObj 要插入的数据对象
	 * @param {string} tableName 要插入的表
	 */
	insert(dataObj, tableName) {
		let db = new mssql.PreparedStatement(this.connect);
		let sql = `insert into ${tableName} (`;
		// 注入数据
		if (dataObj && Object.keys(dataObj).length > 0) {
			// 添加键
			for (const key in dataObj) {
				// 判断参数类型
				let type = typeof dataObj[key];
				switch (type) {
					case 'number':
						db.input(key, mssql.Int);
						break;
					case 'string':
						db.input(key, mssql.VarChar);
						break;
				}
				sql += key + ',';
			}
			// 删除最后一个逗号
			sql = `${sql.slice(0, sql.length - 1)} ) values (`;
			// 添加值
			for (const key in dataObj) {
				// 判断参数类型
				let type = typeof dataObj[key];
				switch (type) {
					case 'number':
						sql += `${dataObj[key]},`;
						break;
					case 'string':
						sql += `'${dataObj[key]}',`;
						break;
				}
			}
			// 删除最后一个逗号
			sql = `${sql.slice(0, sql.length - 1)} )`;
			console.log('insert语句：', sql);
			// 语句准备
			return new Promise((resolve, reject) => {
				// 创建连接
				db.prepare(sql, (err) => {
					if (err) reject(err);
					// 执行并注入参数
					db.execute(dataObj, (err, result) => {
						if (err) reject(err);
						// 释放连接
						db.unprepare((err) => {
							if (err) reject(err);
							// 返回数据
							resolve(result);
						});
					});
				});
			});
		}
	}

	// update 更新
	/**
	 *
	 * @param {object} newDataObj 新的数据对象
	 * @param {object} whereObj 条件对象
	 * @param {string} tableName 表名
	 */
	update(newDataObj, whereObj, tableName) {
		let db = new mssql.PreparedStatement(this.connect);
		let sql = `update ${tableName} set `;
		// 注入数据对象
		if (newDataObj && Object.keys(newDataObj).length > 0) {
			for (const key in newDataObj) {
				// 判断参数类型
				let type = typeof newDataObj[key];
				switch (type) {
					case 'number':
						db.input(key, mssql.Int);
						sql += `${key} = ${newDataObj[key]},`;
						break;
					case 'string':
						db.input(key, mssql.VarChar);
						sql += `${key} = '${newDataObj[key]}',`;
						break;
				}
			}
		}
		// 删除最后一个逗号
		sql = `${sql.slice(0, sql.length - 1)}`;
		// 注入条件对象
		if (whereObj && Object.keys(whereObj).length > 0) {
			sql += ` where `;
			for (const key in whereObj) {
				// 判断参数类型
				let type = typeof whereObj[key];
				switch (type) {
					case 'number':
						db.input(key, mssql.Int);
						sql += `${key} = ${whereObj[key]} and `;
						break;
					case 'string':
						db.input(key, mssql.VarChar);
						sql += `${key} = '${whereObj[key]}' and `;
						break;
				}
			}
		}
		// 删除最后一个 and
		sql = `${sql.slice(0, sql.length - 5)}`;
		console.log('update语句：', sql);
		// 语句准备
		return new Promise((resolve, reject) => {
			// 创建连接
			db.prepare(sql, (err) => {
				if (err) reject(err);
				// 执行并注入参数
				let params = { ...newDataObj, ...whereObj };
				db.execute(params, (err, result) => {
					if (err) reject(err);
					// 释放连接
					db.unprepare((err) => {
						if (err) reject(err);
						// 返回数据
						resolve(result);
					});
				});
			});
		});
	}

	// delete 删除
	/**
	 *
	 * @param {string} tableName 表名
	 * @param {string} whereSql where条件语句
	 * @param {object} params 需要注入的参数
	 */
	del(tableName, whereSql = '', params) {
		let db = new mssql.PreparedStatement(this.connect);
		let sql = `delete from ${tableName} `;
		// 注入变量
		if (params && Object.keys(params).length > 0) {
			for (const key in params) {
				// 判断参数类型
				let type = typeof params[key];
				switch (type) {
					case 'number':
						db.input(key, mssql.Int);
						break;
					case 'string':
						db.input(key, mssql.VarChar);
						break;
				}
			}
		}
		// 拼接条件语句
		sql += whereSql;
		console.log('delete语句：', sql);
		// 语句准备
		return new Promise((resolve, reject) => {
			// 创建连接
			db.prepare(sql, (err) => {
				if (err) reject(err);
				// 执行并注入参数
				db.execute(params, (err, result) => {
					if (err) reject(err);
					// 释放连接
					db.unprepare((err) => {
						if (err) reject(err);
						// 返回数据
						resolve(result);
					});
				});
			});
		});
	}
}

module.exports = new Sql();
