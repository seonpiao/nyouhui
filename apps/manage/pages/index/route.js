module.exports = function(app, pageName) {
  app.route('/').get(function*(next) {
    if (this.session.username) {
      this.result = {
        username: this.session.username
      };
      this.page = 'index';
    } else {
      this.status = 301;
      this.redirect('/login');
    }
  });
}