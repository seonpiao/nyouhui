var request = require('request');
var thunkify = require('thunkify');
var logger = require('log4js').getLogger('manage:api');
var auth = require('../../auth');
var settings = require('../../../../settings');
var _ = require('underscore');
var Mongo = require('../../../../libs/server/mongodb');

module.exports = function(app, pageName, config) {
  app.route('/api/:db/:collection/:id?').get(function*(next) {
    var db = this.request.params.db;
    var collection = this.request.params.collection;
    var id = this.request.params.id;
    try {
      var result =
        yield thunkify(request)({
          url: 'http://' + settings.restful.host + ':' + settings.restful.port + '/' + db + '/' + collection + (id ? '/' + id : ''),
          qs: this.request.query
        });
      var data = JSON.parse(result[1]);
      this.result = {
        code: 200,
        data: data
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
      var result =
        yield thunkify(request)({
          url: 'http://localhost:3000/' + db + '/' + collection,
          json: this.request.body,
          method: this.method,
          headers: this.headers
        });
      var data = result[1];
      if (data.ok) {
        //新增schema，要调整索引
        if (db === config.schema.db && collection === config.schema.collection) {
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
          data: data
        }
      } else {
        this.result = {
          code: 500,
          message: '用户名重复'
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
      var result =
        yield thunkify(request)({
          url: 'http://localhost:3000/' + db + '/' + collection + '/' + id,
          json: newData,
          method: this.method
        });
      //修改schema，要调整索引
      if (db === config.schema.db && collection === config.schema.collection) {
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
      var data = result[1];
      this.result = {
        code: 200,
        data: data
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
      var result =
        yield thunkify(request)({
          url: 'http://localhost:3000/' + db + '/' + collection + '/' + id,
          method: this.method
        });
      var data = result[1];
      this.result = {
        code: 200,
        data: data
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
      var result =
        yield thunkify(request)({
          url: 'http://localhost:3000/dbs'
        });
      var data = JSON.parse(result[1]);
      this.result = {
        code: 200,
        data: data
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