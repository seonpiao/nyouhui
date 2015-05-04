var request = require('request');
var thunkify = require('thunkify');
var logger = require('log4js').getLogger('manage:api');
var auth = require('../../auth');
var settings = require('../../../../settings');
var _ = require('underscore');
var Mongo = require('../../../../libs/server/mongodb');

module.exports = function(app) {
  app.route('/api/:db/:collection/:id?').get(function*(next) {
    var db = this.request.params.db;
    var collection = this.request.params.collection;
    var id = this.request.params.id;
    try {
      var data =
        yield Mongo.request({
          host: app.config.restful.host,
          port: app.config.restful.port,
          db: db,
          collection: collection,
          id: id
        }, {
          qs: this.request.query
        });
      this.result = {
        code: 200,
        result: data
      }
    } catch (e) {
      this.result = {
        code: 500,
        message: e.message
      }
      logger.error(e.stack);
    }
  }).post(function*(next) {
    var db = this.request.params.db;
    var collection = this.request.params.collection;
    var id = this.request.params.id;
    try {
      var data =
        yield Mongo.request({
          host: app.config.restful.host,
          port: app.config.restful.port,
          db: db,
          collection: collection,
          id: id
        }, {
          json: this.request.body,
          method: this.method,
          headers: this.headers
        });
      if (data[db][collection]['ok']) {
        //新增schema，要调整索引
        if (db === app.config.schema.db && collection === app.config.schema.collection) {
          var body = this.request.body;
          var fields = body.fields;
          var dbconn =
            yield Mongo.get(body.db);
          var collection = dbconn.collection(body.collection);
          for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            if (field.index !== 'no') {
              var indexes = {};
              indexes[field.name] = 1;
              yield thunkify(collection.ensureIndex.bind(collection))(indexes, {
                unique: field.index === 'unique'
              });
            }
          }
        }
        this.result = {
          code: 200,
          result: data
        }
      } else {
        this.result = {
          code: 500,
          message: '数据重复'
        }
      }
    } catch (e) {
      this.result = {
        code: 500,
        message: e.message
      }
      logger.error(e.stack);
    }
  }).put(function*(next) {
    var db = this.request.params.db;
    var collection = this.request.params.collection;
    var id = this.request.params.id;
    try {
      var newData = this.request.body;
      delete newData._id;
      var data =
        yield Mongo.request({
          host: app.config.restful.host,
          port: app.config.restful.port,
          db: db,
          collection: collection,
          id: id
        }, {
          json: newData,
          method: this.method
        });
      //修改schema，要调整索引
      if (db === app.config.schema.db && collection === app.config.schema.collection) {
        var body = this.request.body;
        var fields = body.fields;
        var dropped = [];
        var dbconn =
          yield Mongo.get(body.db);
        var collection = dbconn.collection(body.collection);
        for (var i = 0; i < fields.length; i++) {
          var field = fields[i];
          if (field.index !== 'no') {
            var indexes = {};
            indexes[field.name] = 1;
            yield thunkify(collection.ensureIndex.bind(collection))(indexes, {
              unique: field.index === 'unique'
            });
          } else {
            dropped.push(field.name);
          }
        }
        for (var i = 0; i < dropped.length; i++) {
          var exist =
            yield thunkify(collection.indexExists.bind(collection))(dropped[i] + '_1');
          if (exist) {
            yield thunkify(collection.dropIndex.bind(collection))(dropped[i] + '_1');
          }
        }
      }
      this.result = {
        code: 200,
        result: data
      }
    } catch (e) {
      this.result = {
        code: 500,
        message: e.message
      }
      logger.error(e.stack);
    }
  }).delete(function*(next) {
    var db = this.request.params.db;
    var collection = this.request.params.collection;
    var id = this.request.params.id;
    try {
      var data =
        yield Mongo.request({
          host: app.config.restful.host,
          port: app.config.restful.port,
          db: db,
          collection: collection,
          id: id
        }, {
          method: this.method
        });
      this.result = {
        code: 200,
        result: data
      }
    } catch (e) {
      this.result = {
        code: 500,
        message: e.message
      }
      logger.error(e.stack);
    }
  });

  app.route('/api/dbs').get(function*(next) {
    try {
      var data =
        yield Mongo.request({
          host: app.config.restful.host,
          port: app.config.restful.port,
          path: '/dbs'
        });
      this.result = {
        code: 200,
        result: data
      }
    } catch (e) {
      this.result = {
        code: 500,
        message: e.message
      }
      logger.error(e.stack);
    }
  });
}