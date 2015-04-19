module.exports = function(app, pageName) {
  app.route('/').get(function*(next) {
    if (this.session.email) {
      this.result = {
        email: this.session.email
      };
      this.page = 'index';
    } else {
      this.status = 301;
      this.redirect('/login');
    }
  });
}