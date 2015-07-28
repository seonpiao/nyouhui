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
var moment = require('moment');
var parse = require('co-busboy');
var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs');
var cp = require('child_process');

var sha1 = function(str) {
  var shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex')
}

module.exports = function(app) {
  var client = redis.createClient(app.config.redis.port, app.config.redis.host);
  var uploader = require('koa-bylh-upload')({
    host: app.config.upload.host,
    path: app.config.upload.path
  });

  var queryByQuery = function*(db, collection, query) {
    var data =
      yield Mongo.request({
        db: db,
        collection: collection,
        one: true,
        request: {
          qs: {
            query: JSON.stringify(query)
          }
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
            yield thunkify(client.hset.bind(client))(key, field,
              data[field]);
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
    var hasPermission = true;
    try {
      var privilege = JSON.parse(this.global.user.privilege);
      hasPermission = !!privilege[db][collection].read;
    } catch (e) {}
    if (!hasPermission) {
      this.result = {
        code: 403
      };
      return;
    }
    var id = this.request.params.id;
    var query = this.request.query;
    var pagesize = query.pagesize || Infinity;
    var page = 1;
    if (query.page >= 1) {
      page = parseInt(query.page, 10);
    }
    var skip = pagesize * (page - 1);
    query.limit = pagesize;
    query.skip = skip;
    delete query.page;
    delete query.pagesize;
    try {
      var data =
        yield Mongo.request({
          db: db,
          collection: collection,
          id: id,
          request: {
            qs: query
          }
        });
      var filter = {};
      try {
        filter = JSON.parse(query.query);
      } catch (e) {}
      var count =
        yield Mongo.exec({
          collection: collection
        }, 'count', filter);
      this.result = {
        code: 200,
        result: {
          db: db,
          collection: collection,
          data: data,
          page: {
            total: count,
            pagesize: pagesize,
            page: page
          }
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
    var hasPermission = true;
    try {
      var privilege = JSON.parse(this.global.user.privilege);
      hasPermission = !!privilege[db][collection].read;
    } catch (e) {}
    if (!hasPermission) {
      this.result = {
        code: 403
      };
      return;
    }
    var body = this.request.body;
    try {
      //用户表要加密密码
      if (body.password && ((db === app.config.mongo.defaultDB && collection ===
          app.config.mongo.collections.admin) || (db === app.config.mongo.defaultDB &&
          collection === app.config.mongo.collections.user))) {
        body.password = sha1(body.password);
      }
      if (db === 'cl' && collection === 'sells') {
        var goodsName = body.name;
        var count = body.count;
        var goods =
          yield Mongo.request({
            db: 'cl',
            collection: 'goods',
            request: {
              qs: {
                query: JSON.stringify({
                  name: goodsName
                })
              }
            }
          });
        goods = goods['cl']['goods'];
        if (goods && goods.length > 0) {
          var changedItems = [];
          for (var i = 0; i < goods.length; i++) {
            var item = goods[i];
            if (count > 0) {
              if (item.stock >= count) {
                item.stock -= count;
                count = 0;
                changedItems.push(item);
                break;
              } else {
                count -= item.stock;
                item.stock = 0;
                changedItems.push(item);
              }
            }
          }
          if (count > 0) {
            this.result = {
              code: 500,
              message: '库存不足'
            }
            return;
          } else {
            for (var i = 0; i < changedItems.length; i++) {
              var item = changedItems[i];
              item.total_yuan = item.stock * item.unit_yuan;
              var goodsId = item._id + '';
              delete item._id;
              yield Mongo.request({
                db: 'cl',
                collection: 'goods',
                id: goodsId,
                request: {
                  method: 'put',
                  json: item
                }
              });
            }
          }
        }
      }
      var now = Date.now();
      body.create_time = now;
      body.modify_time = now;
      var data =
        yield Mongo.request({
          db: db,
          collection: collection,
          request: {
            json: body,
            method: this.method
          }
        });
      if (data[db][collection]['ok']) {
        //新增schema，要调整索引
        if (collection === app.config.mongo.collections.schema) {
          var fields = body.fields;
          for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            if (field.index !== 'no') {
              var indexes = {};
              indexes[field.name] = 1;
              yield Mongo.exec({
                db: body.db,
                collection: body.collection
              }, 'ensureIndex', indexes, {
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
    var hasPermission = true;
    try {
      var privilege = JSON.parse(this.global.user.privilege);
      hasPermission = !!privilege[db][collection].read;
    } catch (e) {}
    if (!hasPermission) {
      this.result = {
        code: 403
      };
      return;
    }
    var id = this.request.params.id;
    try {
      var newData = this.request.body;
      var saveData = {};
      var originData =
        yield Mongo.request({
          db: db,
          collection: collection,
          id: id
        });
      originData = originData[db][collection];
      if (db === 'cl' && collection === 'sells') {
        if (originData.name !== newData.name) {
          this.result = {
            code: 500,
            message: '不能修改商品名'
          }
          return;
        }
        var goodsName = originData.name;
        var count = newData.count - originData.count;
        var goods =
          yield Mongo.request({
            db: 'cl',
            collection: 'goods',
            request: {
              qs: {
                query: JSON.stringify({
                  name: goodsName
                })
              }
            }
          });
        goods = goods['cl']['goods'];
        if (goods && goods.length > 0) {
          var changedItems = [];
          for (var i = 0; i < goods.length; i++) {
            var item = goods[i];
            if (item.stock >= count) {
              item.stock -= count;
              count = 0;
              changedItems.push(item);
              break;
            } else {
              count -= item.stock;
              item.stock = 0;
              changedItems.push(item);
            }
          }
          if (count > 0) {
            this.result = {
              code: 500,
              message: '库存不足'
            }
            return;
          } else {
            for (var i = 0; i < changedItems.length; i++) {
              var item = changedItems[i];
              item.total_yuan = item.stock * item.unit_yuan;
              var goodsId = item._id + '';
              delete item._id;
              yield Mongo.request({
                db: 'cl',
                collection: 'goods',
                id: goodsId,
                request: {
                  method: 'put',
                  json: item
                }
              });
            }
          }
        }
      }
      extend(saveData, originData);
      extend(saveData, newData);
      delete saveData._id;
      //用户表要加密密码
      if (saveData.password && ((db === app.config.mongo.defaultDB && collection ===
          app.config.mongo.collections.admin) || (db === app.config.mongo.defaultDB &&
          collection === app.config.mongo.collections.user))) {
        saveData.password = sha1(saveData.password);
      }
      saveData.modify_time = Date.now();
      var data =
        yield Mongo.request({
          db: db,
          collection: collection,
          id: id,
          request: {
            json: saveData,
            method: this.method
          }
        });
      //修改schema，要调整索引
      if (collection === app.config.mongo.collections.schema) {
        var body = this.request.body;
        var fields = body.fields;
        var dropped = [];
        var dbconn =
          yield Mongo.get({
            db: body.db,
            hosts: app.config.mongo.hosts.split(',')
          });
        var _collection = dbconn.collection(body.collection);
        for (var i = 0; i < fields.length; i++) {
          var field = fields[i];
          if (field.index !== 'no') {
            var indexes = {};
            indexes[field.name] = 1;
            yield Mongo.exec({
              db: body.db,
              collection: body.collection
            }, 'ensureIndex', indexes, {
              unique: field.index === 'unique'
            });
          } else {
            dropped.push(field.name);
          }
        }
        for (var i = 0; i < dropped.length; i++) {
          var exist =
            yield Mongo.exec({
              db: body.db,
              collection: body.collection
            }, 'indexExists', dropped[i] + '_1');
          if (exist) {
            yield Mongo.exec({
              db: body.db,
              collection: body.collection
            }, 'dropIndex', dropped[i] + '_1');
          }
        }
      }
      this.result = {
        code: 200,
        result: data
      }

      if (collection === app.config.mongo.collections.privilege) {
        co(function*() {
          var key = serializeKeyByQuery(db, 'privilege', {
            db: originData.db,
            collection: originData.collection
          });
          yield thunkify(client.del.bind(client))(key);
        })();
      }
      if (db === app.config.mongo.defaultDB && collection === app.config.mongo.collections.user) {
        co(function*() {
          var key = serializeKeyByQuery(db, 'user', {
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
  }).delete(function*(next) {
    var db = this.request.params.db;
    var collection = this.request.params.collection;
    var hasPermission = true;
    try {
      var privilege = JSON.parse(this.global.user.privilege);
      hasPermission = !!privilege[db][collection].read;
    } catch (e) {}
    if (!hasPermission) {
      this.result = {
        code: 403
      };
      return;
    }
    var id = this.request.params.id;
    try {
      var originData =
        yield Mongo.request({
          db: db,
          collection: collection,
          id: id
        });
      originData = originData[db][collection];
      if (db === 'cl' && collection === 'sells') {
        var goodsName = originData.name;
        var count = originData.count;
        var goods =
          yield Mongo.request({
            db: 'cl',
            collection: 'goods',
            request: {
              qs: {
                query: JSON.stringify({
                  name: goodsName
                })
              }
            }
          });
        goods = goods['cl']['goods'];
        if (goods && goods.length > 0) {
          for (var i = 0; i < goods.length; i++) {
            var item = goods[i];
            item.stock = item.stock * 1 + count * 1;
            item.total_yuan = item.stock * item.unit_yuan;
            var goodsId = item._id + '';
            delete item._id;
            yield Mongo.request({
              db: 'cl',
              collection: 'goods',
              id: goodsId,
              request: {
                method: 'put',
                json: item
              }
            });
            break;
          }
        }
      }
      var data =
        yield Mongo.request({
          db: db,
          collection: collection,
          id: id,
          request: {
            method: this.method
          }
        });
      this.result = {
        code: 200,
        result: data
      };

      // 判断是否需要清空 redis 缓存
      if (collection === app.config.mongo.collections.privilege) {
        co(function*() {
          var key = serializeKeyByQuery(db, collection, {
            db: originData.db,
            collection: originData.collection
          });
          var result = yield thunkify(client.del.bind(client))(key);
        })();
      }
      if (db === app.config.mongo.defaultDB && collection === app.config.mongo.collections.user) {
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

  function writeStream(stream, buffer) {
    return function(done) {
      stream.write(buffer, done);
      stream.on('error', done);
    }
  }

  function endStream(stream) {
    return function(done) {
      stream.end(done);
    }
  }

  function* uploadPart(stream, part) {
    var chunk;
    var size = 0;
    while (null !== (chunk = part.read())) {
      size += chunk.length;
      yield writeStream(stream, chunk);
    }
    yield endStream(stream);
    return size;
  }

  function mkdir(dir) {
    return function(done) {
      mkdirp(dir, function(err) {
        if (err) {
          logger.error(err);
        }
        done();
      })
    }
  }

  function calcHash(file) {
    return function(done) {
      var hash = crypto.createHash('md5');
      var stream = fs.createReadStream(file);
      stream.on('readable', function() {
        while (null !== (chunk = stream.read())) {
          hash.update(chunk);
        }
      });
      stream.on('end', function() {
        done(null, hash.digest('hex'))
      });
    }
  }

  app.route('/api/upload$').post(function*(next) {
    this.json = true;
    var parts = parse(this, {
      autoFields: true
    });
    var part = yield parts;
    try {;
      var from = this.request.query.from || parts.field.from;
      var result = yield uploader.call(this, part, parts.field);
      if (from === 'editor') {
        result.state = 'SUCCESS';
        this.result = result;
      } else {
        this.result = {
          code: 200,
          result: result
        }
      }
    } catch (e) {
      logger.error(e.stack);
      this.result = {
        code: 500,
        message: e.message
      }
    }
  })

  app.route('/api/dbs').get(function*(next) {
    try {
      var data =
        yield Mongo.request({
          host: app.config.mongo.restHost,
          port: app.config.mongo.restPort,
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
