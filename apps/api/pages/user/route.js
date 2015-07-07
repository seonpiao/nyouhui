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

  var auth = require('../../util/auth')(app);
  var checkLogin = require('../../util/checkLogin')(app);
  var getUserById = require('../../util/getUserById')(app);
  var saveUser = require('../../util/saveUser')(app);

  var modifyPassword = function*(user, password) {
    password = sha1(password);
    user.password = password;
    yield saveUser(user);
  };

  var route = app.route('/user');

  route.nested('/getUserInfo').get(function*(next) {
    this.json = true;
    var uid =
      yield checkLogin.call(this);
    if (!uid) return;
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
    var uid =
      yield checkLogin.call(this);
    if (!uid) return;
    var password = this.request.body.password;
    var newPassword = this.request.body.new_password;
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

  route.nested('/updateUserInfo').post(function*(next) {
    this.json = true;
    var uid =
      yield checkLogin.call(this);
    if (!uid) return;
    var body = this.request.body;
    var user =
      yield getUserById.call(this, uid);
    if (user) {
      extend(user, {
        name: body.name,
        sex: body.sex,
        country: body.country,
        birth: body.birth,
        id_type: body.id_type,
        id_num: body.id_num,
        height: body.height,
        weight: body.weight,
        blood_type: body.blood_type,
        email: body.email,
        address: body.address,
        workplace: body.workplace,
        job: body.job,
        emergency_contact: body.emergency_contact
      });
      yield saveUser(user);
      this.result = {
        code: 0
      }
    } else {
      this.result = app.Errors.USER_NOT_EXIST;
    }
  });

  route.nested('/bindPhone').post(function*(next) {
    this.json = true;
    var uid =
      yield checkLogin.call(this);
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
    var uid =
      yield checkLogin.call(this);
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