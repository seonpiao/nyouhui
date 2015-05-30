var Mongo = require('../../../../libs/server/mongodb');
var thunkify = require('thunkify');
var jwt = require('jsonwebtoken');
var captchapng = require('captchapng');
var tokenGenerator = require('random-token');
var crypto = require('crypto');
var padnum = require('padnum');
var moment = require('moment');
var logger = require('log4js').getLogger('api/user');
var extend = require('node.extend');

var sha1 = function(str) {
  var shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex')
}

module.exports = function(app) {

  var auth = require('../../auth')(app);

  var captchas = {};

  var captchasCache = function(token, num) {
    var keys = Object.keys(captchas);
    if (keys.length > 100000) {
      delete captchas[keys.shift()];
    }
    captchas[token] = num;
  };

  var verifyCaptcha = function(token, num) {
    if (num == captchas[token]) {
      delete captchas[token];
      return true;
    }
    return false;
  };

  var sendCaptchaBySms = function*() {

  };

  var addUser = function*(userData, source) {
    source = source || 1;
    var result =
      yield Mongo.request({
        host: app.config.restful.host,
        port: app.config.restful.port,
        db: app.config.uid.db,
        collection: app.config.uid.collection,
        one: true
      }, {
        qs: {
          source: source
        }
      });
    result = result[app.config.uid.db][app.config.uid.collection];
    if (!result) {
      yield Mongo.request({
        host: app.config.restful.host,
        port: app.config.restful.port,
        db: app.config.uid.db,
        collection: app.config.uid.collection
      }, {
        method: 'post',
        json: {
          uid: 0,
          source: source
        }
      });
      result =
        yield Mongo.request({
          host: app.config.restful.host,
          port: app.config.restful.port,
          db: app.config.uid.db,
          collection: app.config.uid.collection,
          one: true
        }, {
          qs: {
            source: source
          }
        });
      result = result[app.config.uid.db][app.config.uid.collection];
    }
    var uid = result.uid;
    uid = source + padnum(uid, 11);
    try {
      yield Mongo.request({
        host: app.config.restful.host,
        port: app.config.restful.port,
        db: app.config.users.db,
        collection: app.config.users.collection
      }, {
        method: 'post',
        json: extend(userData, {
          uid: uid,
          source: source,
          nickname: uid,
          reg_ip: this.ip,
          create_time: moment().format('YYYY-MM-DD HH:mm:ss.SSS')
        })
      })
    } catch (e) {
      return app.Errors.SIGN_PHONE_DUPLICATE
    }
    result.uid++;
    var objectId = result._id + '';
    delete result._id
    yield Mongo.request({
      host: app.config.restful.host,
      port: app.config.restful.port,
      db: app.config.uid.db,
      collection: app.config.uid.collection,
      id: objectId
    }, {
      method: 'put',
      json: result
    });
    return null;
  };

  var route = app.route('/sign');

  route.nested('/captcha/:token').get(function*(next) {
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

  route.nested('/getCaptchaToken').get(function*(next) {
    var num = padnum(parseInt(Math.random() * 10000).toString(), 4);
    var token = tokenGenerator(16);
    captchasCache(token, num);
    this.json = true;
    this.result = {
      code: 0,
      result: {
        token: token
      }
    }
  });

  route.nested('/getPhoneCaptcha').get(function*(next) {
    this.json = true;
    var num = padnum(parseInt(Math.random() * 10000).toString(), 4);
    var phone = this.request.query.phone;
    if (phone) {
      captchasCache(phone, num);
      yield sendCaptchaBySms.call(this, num);
      this.result = {
        code: 0,
        result: {
          num: num
        }
      }
    } else {
      this.result = app.Errors.SIGN_MISSING_PHONE;
    }
  });

  route.nested('/regPhone').post(function*(next) {
    this.json = true;
    var phone = this.request.body.phone;
    var captcha = this.request.body.captcha;
    var password = this.request.body.password;
    var source = 1; //1为本站，其他为外站
    var isCaptchaValid = verifyCaptcha(phone, captcha);
    if (isCaptchaValid) {
      password = sha1(password);
      try {
        var error =
          yield addUser({
            phone: phone,
            password: password
          });
        if (!error) {
          this.result = {
            code: 0
          }
        } else {
          this.result = error;
        }
      } catch (e) {
        logger.error(e.stack);
        this.result = app.Errors.UNKNOWN
      }
    } else {
      this.result = app.Errors.SIGN_INVALID_CAPTCHA
    }
  });

  route.nested('/getAccessToken').post(function*(next) {
    this.json = true;
    var phone = this.request.body.phone;
    var password = this.request.body.password;
    var result =
      yield auth(phone, password);
    if (result) {
      var token = jwt.sign({
        uid: result.uid
      }, app.jwt_secret);
      this.result = {
        code: 0,
        result: {
          token: token,
          uid: result.uid
        }
      }
    } else {
      this.result = app.Errors.SIGN_LOGIN_FAILED
    }
  });

  route.nested('/resetPassword').post(function*() {
    this.json = true;
    var phone = this.request.body.phone;
    var password = this.request.body.password;
    password = sha1(password);
    var captcha = this.request.body.captcha;
    var isCaptchaValid = verifyCaptcha(phone, captcha);
    if (isCaptchaValid) {
      var user =
        yield Mongo.request({
          host: app.config.restful.host,
          port: app.config.restful.port,
          db: app.config.users.db,
          collection: app.config.users.collection,
          one: true
        }, {
          qs: {
            query: JSON.stringify({
              phone: phone
            })
          }
        });
      user = user[app.config.users.db][app.config.users.collection];
      if (user) {
        var id = user._id;
        user.password = password;
        delete user._id;
        yield Mongo.request({
          host: app.config.restful.host,
          port: app.config.restful.port,
          db: app.config.users.db,
          collection: app.config.users.collection,
          id: id
        }, {
          method: 'put',
          json: user
        });
        this.result = {
          code: 0
        }
      } else {
        this.result = app.Errors.UNKNOWN;
      }
    } else {
      this.result = app.Errors.SIGN_INVALID_CAPTCHA;
    }
  });

  route.nested('/destroyAccessToken').get(function*(next) {
    this.session = null;
    this.redirect('/login');
  });
}