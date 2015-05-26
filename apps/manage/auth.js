var jwt = require('jsonwebtoken');

var auth = function*(next) {
  var token = this.request.query.token;
  var isTokenValid = false;
  try {
    isTokenValid = jwt.verify(token || '', 'private key for carrier');
  } catch (e) {}
  if (this.session.username || isTokenValid || this.path.match(/^\/login|bootstrap|css|fonts|img|js|plugins/)) {
    yield next;
  } else {
    if (this.path.match(/^\/api/)) {
      this.json = true;
      this.result = {
        code: 403,
        message: 'Not Allowed.'
      }
    } else {
      this.session.redirectUrl = this.path + (this.querystring ? '?' + this.querystring : '');
      this.status = 301;
      this.redirect('/login');
    }
  }
}

module.exports = auth;