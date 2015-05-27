var cors = require('koa-cors');
var auth = require('./auth');
var session = require('koa-generic-session');
var redisStore = require('koa-redis');

module.exports = function(app) {

  app.keys = ['nyouhui', 'cookie'];

  return {
    port: '9003',
    restful: {
      host: 'nyouhui.com',
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
    middlewares: [session({
      store: redisStore(),
      cookie: {
        domain: global.DOMAIN,
        path: '/',
        maxage: 1000 * 60 * 60 * 24 * 30
      }
    }), cors(), auth(app)]
  }
};