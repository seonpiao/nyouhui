var auth = function*(next) {
  if (this.session.username || this.path.match(/^\/login|bootstrap|css|fonts|img|js|plugins/)) {
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