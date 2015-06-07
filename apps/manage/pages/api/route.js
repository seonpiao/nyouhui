var request = require('request');
var thunkify = require('thunkify');
var logger = require('log4js').getLogger('manage:api');
var auth = require('../../auth');
var _ = require('underscore');
var Mongo = require('../../../../libs/server/mongodb');
var redis = require("redis");
var co = require('co');
var extend = require('node.extend');
var crypto = require('crypto');

var sha1 = function(str) {
  var shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex')
}

module.exports = function(app) {

  var client = redis.createClient(app.config.redis.port, app.config.redis.host);

  var queryByQuery = function*(db, collection, query) {
    var data =
      yield Mongo.request({
        host: app.config.mongo.host,
        port: app.config.mongo.port,
        db: db,
        collection: collection,
        one: true
      }, {
        qs: {
          query: JSON.stringify(query)
        }
      });
    data = data[db][collection];
    return data;
  }

  var serializeKeyByQuery = function(db, collection, query) {
    var sortedQuery = {};
    Object.keys(query).sort().forEach(function(key) {
      sortedQuery[key] = query[key];
    });
    var key = db + '|' + collection + '|' + JSON.stringify(sortedQuery);
    return key;
  };

  var serializeKeyById = function(db, collection, id) {
    return db + '|' + collection + '|' + id;
  };

  var getHashCacheByQuery = function*(db, collection, query, field) {
    var key = serializeKeyByQuery(db, collection, query);
    var reply =
      yield thunkify(client.hget.bind(client))(key, field);
    if (!reply) {
      var data =
        yield queryByQuery(db, collection, query);
      if (data) {
        Object.keys(data).forEach(function(field) {
          co(function*() {
            yield thunkify(client.hset.bind(client))(key, field, data[field]);
          })();
        });
        if (data[field]) {
          reply =
            yield thunkify(client.hget.bind(client))(key, field);
        }
      }
    }
    return reply;
  };

  var getHashCacheById = function*(db, collection, id, field) {
    var key = serializeKeyById(db, collection, id);
    var reply =
      yield thunkify(client[getCmd].bind(client))(key);
    if (!reply) {
      var data =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: db,
          collection: collection,
          id: id
        });
      if (data) {
        data = data[db][collection];
        yield thunkify(client.hset.bind(client))(key, field, data[field]);
        reply = data[field];
      }
    }
  };

  app.route('/api/:db/:collection/:id?').get(function*(next) {
    var db = this.request.params.db;
    var collection = this.request.params.collection;
    var id = this.request.params.id;
    try {
      var data =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: db,
          collection: collection,
          id: id
        }, {
          qs: this.request.query
        });
      this.result = {
        code: 200,
        result: {
          db: db,
          collection: collection,
          data: data
        }
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
    var body = this.request.body;
    try {
      //用户表要加密密码
      if (body.password && ((db === app.config.admin.db && collection === app.config.admin.collection) || (db === app.config.user.db && collection === app.config.user.collection))) {
        body.password = sha1(body.password);
      }
      var data =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: db,
          collection: collection
        }, {
          json: body,
          method: this.method
        });
      if (data[db][collection]['ok']) {
        //新增schema，要调整索引
        if (db === app.config.schema.db && collection === app.config.schema.collection) {
          var fields = body.fields;
          var dbconn =
            yield Mongo.get({
              db: body.db,
              hosts: app.config.mongo.replset.split(',')
            });
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
      var originData =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: db,
          collection: collection,
          id: id
        });
      originData = originData[db][collection];
      extend(originData, newData);
      delete originData._id;
      //用户表要加密密码
      if (originData.password && ((db === app.config.admin.db && collection === app.config.admin.collection) || (db === app.config.user.db && collection === app.config.user.collection))) {
        originData.password = sha1(originData.password);
      }
      var data =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: db,
          collection: collection,
          id: id
        }, {
          json: originData,
          method: this.method
        });
      //修改schema，要调整索引
      if (db === app.config.schema.db && collection === app.config.schema.collection) {
        var body = this.request.body;
        var fields = body.fields;
        var dropped = [];
        var dbconn =
          yield Mongo.get({
            db: body.db,
            hosts: app.config.mongo.replset.split(',')
          });
        var _collection = dbconn.collection(body.collection);
        for (var i = 0; i < fields.length; i++) {
          var field = fields[i];
          if (field.index !== 'no') {
            var indexes = {};
            indexes[field.name] = 1;
            yield thunkify(_collection.ensureIndex.bind(_collection))(indexes, {
              unique: field.index === 'unique'
            });
          } else {
            dropped.push(field.name);
          }
        }
        for (var i = 0; i < dropped.length; i++) {
          var exist =
            yield thunkify(_collection.indexExists.bind(_collection))(dropped[i] + '_1');
          if (exist) {
            yield thunkify(_collection.dropIndex.bind(_collection))(dropped[i] + '_1');
          }
        }
      }
      this.result = {
        code: 200,
        result: data
      }

      if (db === app.config.privilege.db && collection === app.config.privilege.collection) {
        co(function*() {
          var key = serializeKeyByQuery(db, 'privilege', {
            db: db,
            collection: 'users'
          });
          yield thunkify(client.del.bind(client))(key);
        })();
      }
      if (db === app.config.user.db && collection === app.config.user.collection) {
        co(function*() {
          var key = serializeKeyByQuery(db, 'users', {
            uid: originData.uid
          });
          console.log('del:' + key)
          yield thunkify(client.del.bind(client))(key);
        })();
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
      var originData =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: db,
          collection: collection,
          id: id
        });
      originData = originData[db][collection];
      var data =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: db,
          collection: collection,
          id: id
        }, {
          method: this.method
        });
      this.result = {
        code: 200,
        result: data
      };

      // 判断是否需要清空 redis 缓存
      if (db === app.config.privilege.db && collection === app.config.privilege.collection) {
        co(function*() {
          var key = serializeKeyByQuery(db, collection, {
            db: app.config.user.db,
            collection: app.config.user.collection
          });
          yield thunkify(client.del.bind(client))(key);
        })();
      }
      if (db === app.config.user.db && collection === app.config.user.collection) {
        co(function*() {
          var key = serializeKeyByQuery(db, collection, {
            uid: originData.uid
          });
          yield thunkify(client.del.bind(client))(key);
        })();
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
          host: app.config.mongo.host,
          port: app.config.mongo.port,
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