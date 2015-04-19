var response = require('../../libs/server/response');

var auth = function*(next) {
  if (this.session.email || this.path.match(/^\/login|bootstrap|css|fonts|img|js|plugins/)) {
    yield next;
  } else {
    if (this.request.type === 'application/json') {
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
    yield response.call(this);
  }
}

module.exports = auth;