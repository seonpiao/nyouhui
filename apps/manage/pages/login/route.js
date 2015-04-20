module.exports = function(app, pageName) {
  app.route('/login').get(function*(next) {
    this.result = {};
    this.page = 'login';
  }).post(function*(next) {
    var email = this.request.body.email;
    var password = this.request.body.password;
    this.status = 301;
    if ((email === 'admin@nyouhui.com' || email === 'root') && password === '123') {
      this.session.email = email;
      this.redirect(this.session.redirectUrl || '/');
    } else {
      this.redirect('/login');
    }
  });
}