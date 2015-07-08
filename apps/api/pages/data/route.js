var request = require('request');
var thunkify = require('thunkify');
var logger = require('log4js').getLogger('manage:api');
var Mongo = require('../../../../libs/server/mongodb');
var redis = require("redis");
var co = require('co');
var jwt = require('jsonwebtoken');
var moment = require('moment');
var extend = require('node.extend');

module.exports = function(app) {

  var client = redis.createClient(app.config.redis.port, app.config.redis.host);

  var queryById = function*(db, collection, id) {
    return yield Mongo.request({
      host: app.config.mongo.host,
      port: app.config.mongo.port,
      db: db,
      collection: collection,
      id: id
    });
  }

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

  var auth = function*(token, db, collection, action) {
    var isTokenValid = false;
    var uid, userGroup, privilege = false;
    var permissibleGroup =
      yield getHashCacheByQuery(app.config.privilege.db, app.config.privilege.collection, {
        db: db,
        collection: collection
      }, action);
    permissibleGroup = (permissibleGroup || '').split(',');
    if (permissibleGroup.indexOf('all') !== -1) {
      return true;
    }
    try {
      var decoded = jwt.verify(token || '', app.jwt_secret);
      isTokenValid = !!decoded;
    } catch (e) {}
    if (this.session && this.session.uid) {
      uid = this.session.uid;
    } else if (isTokenValid) {
      uid = decoded.uid;
    }
    if (uid) {
      // 根据 db 和 query 进行查询该用户所在用户组
      userGroup =
        yield getHashCacheByQuery(app.config.user.db, app.config.user.collection, {
          uid: uid
        }, 'group');
    }
    // 判断权限
    if (userGroup) {
      userGroup = (userGroup || '').split(',');
      privilege = userGroup.some(function(m) {
        return permissibleGroup.some(function(n) {
          return m == n;
        });
      });
    }
    return privilege;
  }

  var getFieldExtData = function*(fields) {
    var extDatas = {};
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      //从controls表里面，获取字段的附件数据
      var fieldExtData =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: app.config.control.db,
          collection: app.config.control.collection,
          id: field.type
        });
      fieldExtData = fieldExtData[app.config.control.db][app.config.control.collection];
      if (fieldExtData) {
        var fieldParams = fieldExtData.params;
        if (fieldParams) {
          try {
            fieldParams = JSON.parse(fieldParams);
          } catch (e) {
            fieldParams = {};
          }
          //有db和collection，说明这个字段的数据是与外表有关联的
          if (fieldParams.db && fieldParams.collection) {
            //把db和collection附加到field定义上，表名这个字段有关联的外表数据
            field.db = fieldParams.db;
            field.collection = fieldParams.collection;
            var fieldData =
              yield Mongo.request({
                host: app.config.mongo.host,
                port: app.config.mongo.port,
                db: fieldParams.db,
                collection: fieldParams.collection
              });
            var fieldList = fieldData[fieldParams.db][fieldParams.collection];
            if (fieldList) {
              fieldList.forEach(function(item) {
                extDatas[item._id.toString()] = item;
              });
            }
          }
        }
      }
    }
    return extDatas;
  };

  var getCollectionData = function*() {
    var db = this.request.params.db;
    var collection = this.request.params.collection;
    var id = this.request.params.id;
    var query = this.request.query;
    var pagesize = query.pagesize || 10;
    var page = 1;
    if (query.page >= 1) {
      page = parseInt(query.page, 10);
    }
    var skip = pagesize * (page - 1);
    query.limit = pagesize;
    query.skip = skip;
    delete query.page;
    delete query.pagesize;
    //要显示的列表数据
    var data =
      yield Mongo.request({
        host: app.config.mongo.host,
        port: app.config.mongo.port,
        db: db,
        collection: collection,
        id: id
      }, {
        qs: query
      });
    var list = data[db][collection];
    //列表的字段定义数据
    var schema =
      yield Mongo.request({
        host: app.config.mongo.host,
        port: app.config.mongo.port,
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
    var schemaData = schema[app.config.schema.db][app.config.schema.collection];
    if (schemaData) {
      var fields = schemaData.fields;
      //下面是要获取有外联的字段的附加数据
      //获取到关联的外表数据
      var extDatas =
        yield getFieldExtData(fields);
      extDatas.forEach(function(extData) {
        extend(true, data, extData);
      });
    }
    var dbconn =
      yield Mongo.get({
        db: db,
        hosts: app.config.mongo.replset.split(',')
      });
    var coll = dbconn.collection(collection);
    var filter = {};
    try {
      filter = JSON.parse(query.query);
    } catch (e) {}
    var count =
      yield thunkify(coll.count.bind(coll))(filter);
    return {
      data: data,
      db: db,
      collection: collection,
      page: {
        total: count,
        pagesize: pagesize,
        page: page,
        ret: list.length
      }
    };
  }

  var route = app.route('/data');

  route.nested('/:db/:collection/:id?').get(function*(next) {
    this.json = true;
    var token = this.request.query.token;
    var db = this.request.params.db;
    var collection = this.request.params.collection;
    var hasPermission =
      yield auth.call(this, token, db, collection, 'read');
    if (hasPermission) {
      var id = this.request.params.id;
      try {
        var result = yield getCollectionData.call(this);
        this.result = {
          code: 0,
          result: result
        }
      } catch (e) {
        this.result = app.Errors.DATA_READ_ERROR;
        logger.error(e.stack);
      }
    } else {
      this.result = app.Errors.NOT_ALLOWED;
    }
  }).post(function*(next) {
    this.json = true;
    var db = this.request.params.db;
    var collection = this.request.params.collection;
    var body = this.request.body;
    var token = body.token || this.request.query.token;
    var hasPermission =
      yield auth.call(this, token, db, collection, 'write');
    if (hasPermission) {
      try {
        var timeStr = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        body.create_time = timeStr;
        body.modify_time = timeStr;
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
          this.result = {
            code: 0
          }
        } else {
          this.result = app.Errors.DATA_INSERT_ERROR;
        }
      } catch (e) {
        this.result = app.Errors.DATA_INSERT_ERROR;
        logger.error(e.stack);
      }
    } else {
      this.result = app.Errors.NOT_ALLOWED;
    }
  });
}