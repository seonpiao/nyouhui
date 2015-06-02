var Mongo = require('../../../../libs/server/mongodb');
var crypto = require('crypto');
var padnum = require('padnum');
var moment = require('moment');
var logger = require('log4js').getLogger('api/user');
var extend = require('node.extend');
var captcha = require('../../util/captcha');

var sha1 = function(str) {
  var shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex')
}

module.exports = function(app) {

  var auth = require('../../auth')(app);
  var checkLogin = require('../../checkLogin')(app);
  var getUserById = require('../../getUserById')(app);

  var saveUser = function*(userData) {
    var id = userData._id;
    var method = 'post';
    if (userData._id) {
      delete userData._id;
      method = 'put';
    }
    yield Mongo.request({
      host: app.config.restful.host,
      port: app.config.restful.port,
      db: app.config.user.db,
      collection: app.config.user.collection,
      id: id
    }, {
      method: method,
      json: userData
    });
  };

  var modifyPassword = function*(user, password) {
    password = sha1(password);
    user.password = password;
    yield saveUser(user);
  };

  var route = app.route('/user');

  route.nested('/getUserInfo').get(function*(next) {
    this.json = true;
    var uid = checkLogin.call(this);
    if (!uid) return;
    var token = this.request.body.token;
    var user =
      yield getUserById.call(this, uid);
    if (user) {
      delete user._id;
      delete user.password;
      this.result = {
        code: 0,
        result: user
      }
    } else {
      this.result = app.Errors.USER_NOT_EXIST;
    }
  });

  route.nested('/modifyPassword').post(function*(next) {
    this.json = true;
    var uid = checkLogin.call(this);
    if (!uid) return;
    var password = this.request.body.password;
    var newPassword = this.request.body.new_password;
    var token = this.request.body.token;
    var user =
      yield auth(uid, password);
    if (user) {
      yield modifyPassword(user, newPassword);
      this.result = {
        code: 0
      }
    } else {
      this.result = app.Errors.USER_INCORRECT_PASSWORD;
    }
  });

  route.nested('/bindPhone').post(function*(next) {
    this.json = true;
    var uid = checkLogin.call(this);
    if (!uid) return;
    var phone = this.request.body.phone;
    var captchaCode = this.request.body.captcha;
    var isCaptchaValid = captcha.verifyCaptcha(phone, captchaCode);
    if (isCaptchaValid) {
      var user =
        yield getUserById(uid);
      if (user) {
        user.phone = phone;
        yield saveUser(user);
        this.result = {
          code: 0
        }
      } else {
        this.result = app.Errors.USER_NOT_EXIST
      }
    } else {
      this.result = app.Errors.SIGN_INVALID_CAPTCHA
    }
  });

  route.nested('/reportPosition').post(function*() {
    this.json = true;
    var uid = checkLogin.call(this);
    if (!uid) return;
    var x = parseFloat(this.request.body.x);
    var y = parseFloat(this.request.body.y);
    if (!x || !y) {
      this.result = app.Errors.MISSING_PARAMS;
      return;
    }
    var user =
      yield getUserById.call(this, uid);
    if (user) {
      user.loc = {
        type: 'Point',
        coordinates: [x.toFixed(1) * 1, y.toFixed(1) * 1]
      };
      yield saveUser(user);
      this.result = {
        code: 0
      }
    } else {
      this.result = app.Errors.USER_NOT_EXIST
    }
  });
};