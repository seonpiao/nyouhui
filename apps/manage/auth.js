var jwt = require('jsonwebtoken');

var auth = function*(next) {
  var token = this.request.query.token;
  var isTokenValid = false;
  try {
    isTokenValid = jwt.verify(token || '', 'private key for carrier');
  } catch (e) {}
  if (this.path === '/favicon.ico') {
    this.raw = true;
    this.result = 'ha'
  }
  //不走认证
  else if (this.path.match(/^\/install|login|bootstrap|css|fonts|img|js|plugins/)) {
    yield next;
  }
  //登录
  else if ((this.session && this.session.username) || isTokenValid) {
    this.global.username = this.session.username;
    this.global.uid = this.session.uid;
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