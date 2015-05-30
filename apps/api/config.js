var cors = require('koa-cors');
var session = require('koa-generic-session');
var redisStore = require('koa-redis');

module.exports = function(app) {

  app.keys = ['nyouhui', 'cookie'];
  app.jwt_secret = 'jwt_secret_carrier'

  app.Errors = {
    //通用错误
    'UNKNOWN': {
      code: 1000,
      message: '未知错误'
    },
    'MISSING_PARAMS': {
      code: 1001,
      message: '缺少参数'
    },
    'NOT_LOGIN': {
      code: 1001,
      message: '未登录'
    },
    //sign
    'SIGN_INVALID_CAPTCHA': {
      code: 2000,
      message: '验证码错误'
    },
    'SIGN_REG_FAILED': {
      code: 2001,
      message: '用户注册失败'
    },
    'SIGN_LOGIN_FAILED': {
      code: 2002,
      message: '登录失败'
    },
    'SIGN_MISSING_PHONE': {
      code: 2003,
      message: '缺少手机号'
    },
    'SIGN_PHONE_DUPLICATE': {
      code: 2004,
      message: '手机号重复'
    },
    //user
    'USER_INCORRECT_PASSWORD': {
      code: 3000,
      message: '密码不正确'
    },
    'USER_NOT_EXIST': {
      code: 3000,
      message: '用户不存在'
    }
  };

  return {
    port: '9003',
    restful: {
      host: 'localhost',
      // host: 'nyouhui.com',
      port: 3000,
      defaultDb: 'nyouhui'
    },
    redis: {
      host: 'localhost',
      port: 6379
    },
    privilege: {
      db: 'nyouhui',
      collection: 'privilege'
    },
    users: {
      db: 'nyouhui',
      collection: 'users'
    },
    uid: {
      db: 'nyouhui',
      collection: 'uid'
    },
    middlewares: [session({
      store: redisStore(),
      cookie: {
        domain: global.DOMAIN,
        path: '/',
        maxage: 1000 * 60 * 60 * 24 * 30
      }
    }), cors()]
  }
};