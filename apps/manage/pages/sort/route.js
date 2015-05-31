var request = require('request');
var thunkify = require('thunkify');
var logger = require('log4js').getLogger('manage:api');
var auth = require('../../auth');
var _ = require('underscore');
var Mongo = require('../../../../libs/server/mongodb');

module.exports = function(app) {
	app.route('/sort/:db/:collection').get(function*(next) {
		var db = this.request.params.db;
		var collection = this.request.params.collection;
		try {
			//要显示的列表数据
			var data =
				yield Mongo.request({
					host: app.config.restful.host,
					port: app.config.restful.port,
					db: db,
					collection: collection
				}, {
					qs: this.request.query
				});
			//获取sortid
			// logger.info(collection);
			var sort =
				yield Mongo.request({
					host: app.config.restful.host,
					port: app.config.restful.port,
					db: app.config.sort.db,
					collection: app.config.sort.collection,
					one: true
				}, {
					qs: {
						query: JSON.stringify({
							sort_type: collection
						})
					}
				});


			//列表的字段定义数据
			var _data = {};
			var schema =
				yield Mongo.request({
					host: app.config.restful.host,
					port: app.config.restful.port,
					db: app.config.schema.db,
					collection: app.config.schema.collection,
					one: true
				}, {
					qs: {
						query: JSON.stringify({
							db: db,
							collection: collection
						})
					}
				});

			if (sort[db].sortlist) {
				var sortlist = sort[db].sortlist.sort.split(',');
				data[db][collection] = data[db][collection].sort(function(v1, v2) {
					return sortlist.indexOf(v1._id.toString()) - sortlist.indexOf(v2._id.toString())
				})
			}

			this.result = {
				code: 200,
				result: {
					data: data || [],
					db: db,
					collection: collection,
					schema: schema,
					sort: sort || {}
				}
			}

		} catch (e) {
			this.result = {
				code: 500,
				message: e.message
			}
			logger.error(e.stack);
		}
		this.view = 'update';
	});

}