var request = require('request');
var thunkify = require('thunkify');
var logger = require('log4js').getLogger('manage:api');
var Mongo = require('../../../../libs/server/mongodb');
var redis = require("redis");
var co = require('co');
var jwt = require('jsonwebtoken');

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
        yield getHashCacheByQuery(app.config.users.db, app.config.users.collection, {
          uid: uid
        }, 'group');
    }

    // 判断权限
    if (userGroup) {
      var permissibleGroup =
        yield getHashCacheByQuery(app.config.privilege.db, app.config.privilege.collection, {
          db: db,
          collection: collection
        }, action);

      userGroup = (userGroup || '').split(',');
      permissibleGroup = (permissibleGroup || '').split(',');
      privilege = userGroup.some(function(m) {
        return permissibleGroup.some(function(n) {
          return m == n;
        });
      });
    }
    return privilege;
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
    } else {
      this.result = {
        code: 403,
        message: 'Not Allowed'
      }
    }
  }).post(function*(next) {
    var db = this.request.params.db;
    var collection = this.request.params.collection;
    var body = this.request.body;
    var token = body.token || this.request.query.token;
    var hasPermission =
      yield auth.call(this, token, db, collection, 'write');
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
  });
}