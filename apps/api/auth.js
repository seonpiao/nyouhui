var jwt = require('jsonwebtoken');
var thunkify = require('thunkify');
var redis = require("redis");
var Mongo = require('../../libs/server/mongodb');
var co = require('co');
var client;

var auth = function(app) {

  var queryById = function*(db, collection, id) {
    return yield Mongo.request({
      host: app.config.restful.host,
      port: app.config.restful.port,
      db: db,
      collection: collection,
      id: id
    });
  }

  var queryByQuery = function*(db, collection, query) {
    var data =
      yield Mongo.request({
        host: app.config.restful.host,
        port: app.config.restful.port,
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
          reply = yield thunkify(client.hget.bind(client))(key, field);
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
          host: app.config.restful.host,
          port: app.config.restful.port,
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

  return function*(next) {
    if (!client) {
      client = redis.createClient(app.config.redis.port, app.config.redis.host);
    }
    var requestPath = this.request.path;
    var pathArray = requestPath.split('/');
    var db = pathArray[1];
    var collection = pathArray[2];

    var token = this.request.query.token;
    var isTokenValid = false;
    var username, userGroup, privilege;
    try {
      var decoded = jwt.verify(token || '', 'private key for carrier');
      isTokenValid = !!decoded;
    } catch (e) {}
    if (this.session) {
      username = this.session.username;
    } else if (isTokenValid) {
      username = decoded.username;
    }
    if (username) {
      // 根据 db 和 query 进行查询该用户所在用户组
      userGroup =
        yield getHashCacheByQuery('nyouhui', 'users', {
          username: username
        }, 'group');
      console.log('userGroup: ' + userGroup);
    }

    // 判断权限
    if (userGroup) {
      var permissibleGroup =
        yield getHashCacheByQuery('nyouhui', 'privilege', {
          db: db,
          collection: collection
        }, 'read');

      userGroup = (userGroup || '').split(',');
      permissibleGroup = (permissibleGroup || '').split(',');
      console.log(userGroup, permissibleGroup);
      privilege = userGroup.some(function(m) {
        return permissibleGroup.some(function(n) {
          return m == n;
        });
      });
      console.log('privilege: ' + privilege);
    }
    if (privilege) {
      yield next;
      
    } else {
      this.json = true;
      this.result = {
        code: 403,
        message: 'Not Allowed.'
      };
    }
  };
};

module.exports = auth;
