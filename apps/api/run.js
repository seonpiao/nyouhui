var cors = require('kcors');
var session = require('koa-generic-session');
var redisStore = require('koa-redis');

module.exports = function(app, config) {

  app.keys = ['firstre'];
  app.jwt_secret = 'jwt_secret_firstre';

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
      code: 1002,
      message: '未登录'
    },
    'NOT_ALLOWED': {
      code: 1003,
      message: '没有权限'
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
    'SIGN_PHONE_NOT_EXIST': {
      code: 2005,
      message: '手机号不存在'
    },
    'SIGN_SEND_SMS_FAILED': {
      code: 2006,
      message: '验证码发送失败'
    },
    'SIGN_INVALID_PASSWORD': {
      code: 2007,
      message: '密码不符合要求'
    },
    //user
    'USER_INCORRECT_PASSWORD': {
      code: 3000,
      message: '密码不正确'
    },
    'USER_NOT_EXIST': {
      code: 3001,
      message: '用户不存在'
    },
    'USER_XINGE_REQUEST_FAILED': {
      code: 3002,
      message: '请求信鸽服务器失败'
    },
    'USER_XINGE_REQUEST_ERROR': {
      code: 3003,
      message: '请求信鸽服务器失败'
    },
    'USER_INVALID_NICKNAME': {
      code: 3004,
      message: '名称包含敏感词'
    },
    //data
    'DATA_INSERT_ERROR': {
      code: 4000,
      message: '插入数据库失败'
    },
    'DATA_READ_ERROR': {
      code: 4001,
      message: '读取数据库失败'
    },
    //resource
    'RESOURCE_UPLOAD_FAILED': {
      code: 5000,
      message: '资源上传失败'
    },
    'RESOURCE_DUPLICATE': {
      code: 5001,
      message: '资源已存在'
    },
    'RESOURCE_NOT_FOUND': {
      code: 5002,
      message: '资源不存在'
    },
    'RESOURCE_INVALID_HELPID': {
      code: 5003,
      message: '呼救id错误'
    },
    //sos
    'SOS_MORE_THEN_ONCE': {
      code: 6000,
      message: '当前有呼救正在进行'
    },
    'SOS_IN_RESCUR': {
      code: 6001,
      message: '您已参加本次救援'
    },
    'SOS_CANNOT_HELP_SELF': {
      code: 6002,
      message: '不能应答自己的救援'
    },
    'SOS_HELP_NOT_FOUND': {
      code: 6003,
      message: '不存在这次救援'
    }
  };

  app.Middlewares = [session({
    store: redisStore(),
    cookie: {
      domain: global.DOMAIN,
      path: '/',
      maxage: 1000 * 60 * 60 * 24 * 30
    }
  }), cors({
    origin: function(ctx) {
      return ctx.headers.origin;
    }
  })];
};
