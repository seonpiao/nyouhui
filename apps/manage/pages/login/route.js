var Mongo = require('../../../../libs/server/mongodb');
var thunkify = require('thunkify');

module.exports = function(app) {
  app.route('/login').get(function*(next) {
    this.result = {};
    this.page = 'login';
  }).post(function*(next) {
    var username = this.request.body.username;
    var password = this.request.body.password;
    this.status = 301;
    var db =
      yield Mongo.get(app.config.admins.db);
    var collection = db.collection(app.config.admins.collection);
    var cursor =
      yield thunkify(collection.find.bind(collection))({
        username: username,
        password: password
      });
    result =
      yield thunkify(cursor.toArray.bind(cursor))();
    if (result && result.length === 1) {
      this.session.username = username;
      this.redirect(this.session.redirectUrl || '/');
    } else {
      this.redirect('/login');
    }
  });

  app.route('/logout').get(function*(next) {
    this.session = null;
    this.redirect('/login');
  });
}