var jwt = require('jsonwebtoken');

var checkLogin = function(app) {
  return function() {
    var token = this.request.query.token || this.request.body.token;
    var isTokenValid = false,
      decoded = {};
    try {
      decoded = jwt.verify(token || '', app.jwt_secret);
      isTokenValid = !!decoded;
    } catch (e) {}
    if (isTokenValid || this.path.match(/^\/login|bootstrap|css|fonts|img|js|plugins/)) {
      return decoded.uid;
    }
    this.result = app.Errors.NOT_LOGIN;
    return false;
  }
}

module.exports = checkLogin;