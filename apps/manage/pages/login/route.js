var Mongo = require('../../../../libs/server/mongodb');
var thunkify = require('thunkify');
var jwt = require('jsonwebtoken');
var captchapng = require('captchapng');
var tokenGenerator = require('random-token');

module.exports = function(app) {

  var auth = function*(username, password) {
    var result =
      yield Mongo.request({
        host: app.config.restful.host,
        port: app.config.restful.port,
        db: app.config.admins.db,
        collection: app.config.admins.collection,
        one: true
      }, {
        qs: {
          query: JSON.stringify({
            username: username,
            password: password
          })
        }
      });
    result = result[app.config.admins.db][app.config.admins.collection];
    if (result) {
      return result;
    } else {
      return false;
    }
  };

  app.route('/login').get(function*(next) {
    this.result = {};
    this.page = 'login';
  }).post(function*(next) {
    var username = this.request.body.username;
    var password = this.request.body.password;
    this.status = 301;
    var result =
      yield auth(username, password);
    if (result) {
      this.session.username = username;
      this.redirect(this.session.redirectUrl || '/schema');
    } else {
      this.redirect('/login');
    }
  });

  app.route('/logout').get(function*(next) {
    this.session = null;
    this.redirect('/login');
  });
}