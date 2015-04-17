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
  }).post(function*(next) {
    var email = this.request.body.email;
    var password = this.request.body.password;
    this.status = 301;
    if (email === 'admin@nyouhui.com' && password === '123') {
      this.session.email = email;
      this.redirect('/');
    } else {
      this.redirect('/login');
    }
  });
}