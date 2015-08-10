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

var sanitize = function(s) {
  return s.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
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

  var applyCustomTemplate = function*(list, db, collection) {
    var schema =
      yield Mongo.request({
        collection: app.config.mongo.collections.schema,
        one: true,
        request: {
          qs: {
            query: JSON.stringify({
              db: db,
              collection: collection
            })
          }
        }
      });
    var schemaData = schema[app.config.mongo.defaultDB][app.config.mongo.collections.schema];
    if (schemaData) {
      var fields = schemaData.fields;
      //检查有哪些自定义的模板
      var templates = {};
      fields.forEach(function(field) {
        if (field.template) {
          templates[field.name] = field.template;
        }
      });
      Object.keys(templates).forEach(function(fieldName) {
        list.forEach(function(row) {
          row[fieldName] = jade.render(templates[fieldName], row);
        });
      });
    }
  };

  var emitEvent = function*(db, collection, stage, action, data) {
    var events = yield Mongo.request({
      collection: app.config.mongo.collections.event,
      request: {
        qs: {
          query: JSON.stringify({
            db: db,
            collection: collection,
            stage: stage,
            action: action
          })
        }
      }
    });
    events = events[app.config.mongo.defaultDB][app.config.mongo.collections.event];
    if (events) {
      for (var i = 0; i < events.length; i++) {
        var flowData = yield global.manage.runTask({
          taskid: events[i].taskid,
          beginData: {
            db: events[i].db,
            collection: events[i].colletion,
            data: data
          },
          username: this.session.username
        });
        if (flowData) {
          extend(data, flowData.data);
        }
      }
    }
  };

  var getCollectionData = function*() {
    var db = this.request.params.db;
    var collection = this.request.params.collection;
    var id = this.request.params.id;
    var query = this.request.query;
    var customSort = query.custom_sort;
    var withoutSchema = !(query.with_schema === '1');
    var pagesize = (query.perPage || query.pagesize || Infinity) * 1;
    var page = 1;
    if (query.page >= 1) {
      page = parseInt(query.page, 10);
    }
    var filter = {},
      sort = {};
    if (query.query) {
      try {
        filter = JSON.parse(query.query);
      } catch (e) {}
    }
    for (var key in query) {
      var value = query[key];
      if (key.match(/queries\[(.+?)\]/)) {
        key = RegExp.$1;
        if (key === 'search') {
          var columns = query.columns.split(',');
          var _filter = [];
          columns.filter(function(col) {
            return !filter[col];
          }).forEach(function(col, index) {
            var obj = {};
            obj[col] = {
              $regex: sanitize(value)
            };
            _filter.push(obj);
            obj = {};
            obj['__' + col + '_pinyin'] = {
              $regex: sanitize(value.toLowerCase())
            }
            _filter.push(obj);
            obj = {};
            obj['__' + col + '_suoxie'] = {
              $regex: sanitize(value.toLowerCase())
            }
            _filter.push(obj);
          });
          filter['$or'] = _filter;
        } else {
          filter[key] = value;
        }
      } else if (key.match(/sorts\[(.+?)\]/)) {
        key = RegExp.$1;
        sort[key] = value * 1;
      }
    }
    //要显示的列表数据
    var data = yield Mongo.request({
      db: db,
      collection: collection,
      id: id,
      page: page,
      pagesize: pagesize,
      filter: filter,
      sort: sort,
      customSort: customSort
    });
    data[db][collection] = data[db][collection] || [];
    var list = data[db][collection];
    var extDatas = (yield Mongo.getExtData({
      collection: collection,
      withoutSchema: withoutSchema
    })).extDatas;
    yield applyCustomTemplate(list, db, collection);
    var _data = {};
    for (var i = 0; i < extDatas.length; i++) {
      extend(true, _data, extDatas[i]);
    }
    var count =
      yield Mongo.exec({
        collection: collection
      }, 'count', filter);
    var ret = {
      data: data,
      _data: _data,
      db: db,
      collection: collection,
      page: {
        total: count,
        pagesize: pagesize,
        page: page,
        ret: list.length
      }
    }
    if (!withoutSchema) {
      ret.schema = _data[app.config.mongo.defaultDB][app.config.mongo.collections.schema];
      delete _data[app.config.mongo.defaultDB][app.config.mongo.collections.schema];
    }
    return ret;
  }

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
    var query = this.request.query;
    yield emitEvent.call(this, db, collection, 'before', 'find', query);
    try {
      var result = yield getCollectionData.call(this);
      var data = result.data[db][collection];
      yield emitEvent.call(this, db, collection, 'after', 'find', data);
      this.result = {
        code: 200,
        result: result
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
    var self = this;
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
    yield emitEvent.call(this, db, collection, 'before', 'insert', body);
    try {
      if (db === 'cl' && collection === 'sells') {

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
        yield emitEvent.call(this, db, collection, 'after', 'insert', body);
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
    var self = this;
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
    var newData = this.request.body;
    yield emitEvent.call(this, db, collection, 'before', 'update', newData);
    try {
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
      saveData.modify_time = Date.now();
      var data =
        yield Mongo.request({
          db: db,
          collection: collection,
          _id: id,
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
      yield emitEvent.call(this, db, collection, 'after', 'update', newData);
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
    var self = this;
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
    yield emitEvent.call(this, db, collection, 'before', 'remove', id);
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
      yield emitEvent.call(this, db, collection, 'after', 'remove', id);
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
