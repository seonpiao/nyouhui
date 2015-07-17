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
      yield getHashCacheByQuery(app.config.privilege.db, app.config.privilege
        .collection, {
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

  var getCollectionData = function*() {
    var db = this.request.params.db;
    var collection = this.request.params.collection;
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
    //要显示的列表数据
    var data =
      yield Mongo.request({
        host: app.config.mongo.host,
        port: app.config.mongo.port,
        db: db,
        collection: collection,
        id: id,
        request: {
          qs: query
        }
      });
    var list = data[db][collection];
    var extDatas = yield Mongo.getExtData({
      collection: collection
    });
    for (var i = 0; i < extDatas.length; i++) {
      extend(true, data, extDatas[i]);
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
      yield Mongo.exec({
        collection: collection
      }, 'count', filter);
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
        var now = Date.now();
        body.create_time = now;
        body.modify_time = now;
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
