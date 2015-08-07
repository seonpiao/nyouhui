var Mongo = require('../../../../libs/server/mongodb');
var thunkify = require('thunkify');
var jwt = require('jsonwebtoken');
var captchapng = require('captchapng');
var tokenGenerator = require('random-token');
var crypto = require('crypto');

var sha1 = function(str) {
  var shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex')
}

module.exports = function(app) {

  var auth = function*(username, password) {
    if (username === 'root' && password === app.config.root.password) {
      return app.config.root;
    }
    password = sha1(password);
    var result =
      yield Mongo.request({
        collection: app.config.mongo.collections.admin,
        one: true,
        request: {
          qs: {
            query: JSON.stringify({
              username: username,
              password: password
            })
          }
        }
      });
    result = result[app.config.mongo.defaultDB][app.config.mongo.collections.admin];
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
