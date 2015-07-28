var jwt = require('jsonwebtoken');
var redis = require("redis");
var thunkify = require('thunkify');

var checkLogin = function(app) {
  var client = redis.createClient(app.config.redis.port, app.config.redis.host);
  return function*(token) {
    token = token || this.request.query.token || this.request.body.token;
    var isTokenValid = false,
      decoded = {};
    try {
      decoded = jwt.verify(token || '', app.jwt_secret);
      isTokenValid = !!decoded;
    } catch (e) {}
    if (isTokenValid || this.path.match(/^\/login|bootstrap|css|fonts|img|js|plugins/)) {
      var reply =
        yield thunkify(client.get.bind(client))('app_session_' + decoded.uid);
      if (reply) {
        return decoded.uid;
      }
    }
    this.result = app.Errors.NOT_LOGIN;
    return false;
  }
}

module.exports = checkLogin;
