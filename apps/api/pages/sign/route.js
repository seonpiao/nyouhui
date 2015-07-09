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
var captcha = require('../../util/captcha');
var redis = require("redis");
var request = require('request');

var sha1 = function(str) {
  var shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex')
}

var errorCount = {};

module.exports = function(app) {

  var auth = require('../../util/auth')(app);
  var checkLogin = require('../../util/checkLogin')(app);
  var client = redis.createClient(app.config.redis.port, app.config.redis.host);

  var addUser = function*(userData, source) {
    source = source || 1;
    var result =
      yield Mongo.request({
        host: app.config.mongo.host,
        port: app.config.mongo.port,
        db: app.config.uid.db,
        collection: app.config.uid.collection,
        one: true
      }, {
        qs: {
          query: JSON.stringify({
            source: source
          })
        }
      });
    result = result[app.config.uid.db][app.config.uid.collection];
    if (!result) {
      yield Mongo.request({
        host: app.config.mongo.host,
        port: app.config.mongo.port,
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
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: app.config.uid.db,
          collection: app.config.uid.collection,
          one: true
        }, {
          qs: {
            query: JSON.stringify({
              source: source
            })
          }
        });
      result = result[app.config.uid.db][app.config.uid.collection];
    }
    var uid = result.uid;
    uid = source + padnum(uid, 11);
    yield Mongo.request({
      host: app.config.mongo.host,
      port: app.config.mongo.port,
      db: app.config.user.db,
      collection: app.config.user.collection
    }, {
      method: 'post',
      json: extend(userData, {
        uid: uid,
        source: source,
        nickname: uid,
        group: ['normal'], // 默认用户组
        reg_ip: this.ip,
        create_time: moment().format('YYYY-MM-DD HH:mm:ss.SSS')
      })
    })
    result.uid++;
    var objectId = result._id + '';
    delete result._id
    yield Mongo.request({
      host: app.config.mongo.host,
      port: app.config.mongo.port,
      db: app.config.uid.db,
      collection: app.config.uid.collection,
      id: objectId
    }, {
      method: 'put',
      json: result
    });
    return uid;
  };

  var createSession = function*(uid) {
    var token = jwt.sign({
      uid: uid
    }, app.jwt_secret);
    yield thunkify(client.set.bind(client))('app_session_' + uid, Date.now());
    //设置一个月的有效期
    yield thunkify(client.expire.bind(client))('app_session_' + uid, 60 * 60 * 24 * 30);
    return token;
  };

  var route = app.route('/sign');

  route.nested('/captcha/:token').get(function*(next) {
    this.raw = true;
    var token = this.request.params.token;
    var num = captcha.getCachedCaptcha(token);
    var p = new captchapng(80, 30, num);
    p.color(0, 0, 0, 0); // First color: background (red, green, blue, alpha)
    p.color(80, 80, 80, 255); // Second color: paint (red, green, blue, alpha)

    var img = p.getBase64();
    var imgbase64 = new Buffer(img, 'base64');
    this.set('Content-Type', 'image/png');
    this.result = imgbase64;
  });

  route.nested('/getCaptchaToken').get(function*(next) {
    var token = tokenGenerator(16);
    captcha.getCaptcha(token);
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
    var phone = this.request.query.phone;
    if (phone) {
      try {
        var num =
          yield captcha.sendCaptchaBySms(phone);
        this.result = {
          code: 0,
          result: {
            num: num
          }
        }
      } catch (e) {
        logger.error(e.stack);
        // this.result = app.Errors.SIGN_SEND_SMS_FAILED;
      }
    } else {
      this.result = app.Errors.SIGN_MISSING_PHONE;
    }
  });

  route.nested('/regPhone').post(function*(next) {
    this.json = true;
    var phone = this.request.body.phone;
    var captchaCode = this.request.body.captcha;
    var password = this.request.body.password;
    var source = 1; //1为本站，其他为外站
    var isCaptchaValid = captcha.verifyCaptcha(phone, captchaCode);
    if (isCaptchaValid) {
      var user =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: app.config.user.db,
          collection: app.config.user.collection
        }, {
          qs: {
            query: JSON.stringify({
              phone: phone
            })
          }
        });
      user = user[app.config.user.db][app.config.user.collection];
      if (user && user.length === 1) {
        this.result = app.Errors.SIGN_PHONE_DUPLICATE;
      } else {
        password = sha1(password);
        var uid =
          yield addUser({
            phone: phone,
            password: password
          });
        var token = yield createSession(uid);
        this.result = {
          code: 0,
          result: {
            token: token
          }
        }
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
      var token = yield createSession(result.uid);
      errorCount[phone] = 0;
      this.result = {
        code: 0,
        result: {
          token: token
        }
      }
    } else {
      if (!phone in errorCount) {
        errorCount[phone] = 0;
      }
      errorCount[phone]++;
      this.result = app.Errors.SIGN_LOGIN_FAILED
    }
  });

  route.nested('/getAccessTokenByOAuth').post(function*(next) {
    this.json = true;
    var from = this.request.body.from; //从哪个第三方过来的
    var oauthToken = this.request.body.token;
    var oauthUid = this.request.body.uid;
    var valid = false;
    switch (from) {
      case 'weixin':
        var result = yield thunkify(request)({
          url: 'https://api.weixin.qq.com/sns/userinfo?access_token=' + oauthToken + '&openid=' + oauthUid
        });
        result = JSON.parse(result[1]);
        if (result.openid) {
          valid = true;
        }
        break;
      case 'weibo':
        var result = yield thunkify(request)({
          url: 'https://api.weibo.com/oauth2/get_token_info',
          method: 'POST',
          form: 'access_token=' + oauthToken
        });
        result = JSON.parse(result[1]);
        if (result.uid === oauthUid) {
          valid = true;
        }
        break;
    }
    if (valid) {
      var user =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: app.config.user.db,
          collection: app.config.user.collection
        }, {
          qs: {
            query: JSON.stringify({
              oauth_uid: oauthUid
            })
          }
        });
      user = user[app.config.user.db][app.config.user.collection];
      var uid;
      if (user && user.length === 1) {
        uid = user[0].uid;
      } else {
        try {
          var uid =
            yield addUser({
              oauth_uid: oauthUid
            }, 2);
        } catch (e) {
          this.result = e;
          return
        }
      }
      var token = yield createSession(uid);
      this.result = {
        code: 0,
        result: {
          token: token
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
    var captchaCode = this.request.body.captcha;
    var isCaptchaValid = captcha.verifyCaptcha(phone, captchaCode);
    if (isCaptchaValid) {
      var user =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: app.config.user.db,
          collection: app.config.user.collection,
          one: true
        }, {
          qs: {
            query: JSON.stringify({
              phone: phone
            })
          }
        });
      user = user[app.config.user.db][app.config.user.collection];
      if (user) {
        var id = user._id;
        user.password = password;
        delete user._id;
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: app.config.user.db,
          collection: app.config.user.collection,
          id: id
        }, {
          method: 'put',
          json: user
        });
        this.result = {
          code: 0
        }
      } else {
        this.result = app.Errors.SIGN_PHONE_NOT_EXIST;
      }
    } else {
      this.result = app.Errors.SIGN_INVALID_CAPTCHA;
    }
  });

  route.nested('/destroyAccessToken').get(function*(next) {
    this.json = true;
    var uid =
      yield checkLogin.call(this);
    if (uid) {
      yield thunkify(client.del.bind(client))('app_session_' + uid);
    }
    this.result = {
      code: 0
    };
  });
}