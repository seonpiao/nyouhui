var Mongo = require('../../../../libs/server/mongodb');
var thunkify = require('thunkify');
var jwt = require('jsonwebtoken');
var captchapng = require('captchapng');
var tokenGenerator = require('random-token');
var crypto = require('crypto');
var redis = require("redis");

var sha1 = function(str) {
  var shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex')
}


module.exports = function(app) {

  var client = redis.createClient(app.config.redis.port, app.config.redis.host);

  var createSession = function*(uid) {
    var token = jwt.sign({
      uid: uid
    }, app.jwt_secret);
    yield thunkify(client.set.bind(client))('app_session_' + uid, token);
    //设置一个月的有效期
    yield thunkify(client.expire.bind(client))('app_session_' + uid, 60 * 60 * 24 * 30);
    return token;
  };

  var auth = function*(username, password) {
    if (username === 'root' && password === app.config.root.password) {
      return app.config.root;
    }
    password = sha1(password);
    var result =
      yield Mongo.request({
        collection: app.config.mongo.collections.admin,
        one: true,
        request: {
          qs: {
            query: JSON.stringify({
              username: username,
              password: password
            })
          }
        }
      });
    result = result[app.config.mongo.defaultDB][app.config.mongo.collections.admin];
    if (result) {
      return result;
    } else {
      return false;
    }
  };

  app.route('/login').get(function*(next) {
    this.result = {};
    this.page = 'login';
  }).post(function*(next) {
    var username = this.request.body.username;
    var password = this.request.body.password;
    this.status = 301;
    var result =
      yield auth(username, password);
    if (result) {
      var token = yield createSession(username);
      this.session.username = username;
      this.cookies.set('token', token, {
        signed: true,
        domain: global.DOMAIN,
        path: '/',
        maxage: 1000 * 60 * 60 * 24 * 30
      });
      this.redirect(this.session.redirectUrl || '/');
    } else {
      this.redirect('/login');
    }
  });

  app.route('/logout').get(function*(next) {
    this.session = null;
    this.redirect('/login');
  });
}
