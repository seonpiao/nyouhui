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
        collection: app.config.admins.collection
      }, {
        qs: {
          query: JSON.stringify({
            username: username,
            password: password
          })
        }
      });
    result = result[app.config.admins.db][app.config.admins.collection];
    if (result && result.length === 1) {
      return true;
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

  app.route('/login/getAccessToken').post(function*(next) {
    var username = this.request.body.username;
    var password = this.request.body.password;
    this.json = true;
    var result =
      yield auth(username, password);
    if (result) {
      var token = jwt.sign({
        username: username
      }, 'private key for carrier');
      this.result = {
        code: 200,
        result: {
          token: token
        }
      }
    } else {
      this.result = {
        code: 401
      };
    }
  });

  var captchas = {};

  var captchasCache = function(token, num) {
    var keys = Object.keys(captchas);
    if (keys.length > 100000) {
      delete captchas[keys.shift()];
    }
    captchas[token] = num;
  };

  var verifyCaptcha = function(token, num) {
    return num == captchas[token];
  };

  app.route('/login/getCaptchaToken').get(function*(next) {
    var num = parseInt(Math.random() * 9000 + 1000).toString();
    var token = tokenGenerator(16);
    captchasCache(token, num);
    this.json = true;
    this.result = {
      code: 200,
      result: {
        token: token
      }
    }
  });

  app.route('/login/captcha/:token').get(function*(next) {
    this.raw = true;
    var token = this.request.params.token;
    var num = captchas[token];
    if (isNaN(num)) {
      num = '9999';
    }
    var p = new captchapng(80, 30, num);
    p.color(0, 0, 0, 0); // First color: background (red, green, blue, alpha)
    p.color(80, 80, 80, 255); // Second color: paint (red, green, blue, alpha)

    var img = p.getBase64();
    var imgbase64 = new Buffer(img, 'base64');
    this.set('Content-Type', 'image/png');
    this.result = imgbase64;
  });

  app.route('/logout').get(function*(next) {
    this.session = null;
    this.redirect('/login');
  });
}