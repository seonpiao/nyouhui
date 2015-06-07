var session = require('koa-generic-session');
var auth = require('./auth');
var task = require('./task');
var menu = require('./menu');
var jsonApi = require('./jsonApi');
var redisStore = require('koa-redis');

module.exports = function(app) {

  app.keys = ['firstre'];
  app.jwt_secret = 'jwt_secret_firstre';

  var config = {
    name: '第一反应',
    port: '9999',
    socket: {
      port: 12345
    },
    mongo: {
      host: 'localhost',
      port: 3000,
      replset: 'localhost'
    },
    redis: {
      host: 'localhost',
      port: 6379
    },
    schema: {
      db: 'stock',
      collection: 'schema'
    },
    admin: {
      db: 'stock',
      collection: 'admin'
    },
    privilege: {
      db: 'stock',
      collection: 'privilege'
    },
    user: {
      db: 'stock',
      collection: 'user'
    },
    uid: {
      db: 'stock',
      collection: 'uid'
    },
    menu: {
      db: 'stock',
      collection: 'menu'
    },
    step: {
      db: 'stock',
      collection: 'step'
    },
    task: {
      db: 'stock',
      collection: 'task'
    },
    tasklog: {
      db: 'stock',
      collection: 'tasklog'
    },
    control: {
      db: 'stock',
      collection: 'control'
    },
    db: {
      hosts: 'localhost'
    },
    middlewares: [session({
      store: redisStore(),
      cookie: {
        domain: global.DOMAIN,
        path: '/',
        maxage: 1000 * 60 * 60 * 24 * 30
      }
    }), auth, jsonApi, menu(app), function*(next) {
      this.global.socket = app.config.socket
      yield next;
    }, task(app)]
  }

  var server = require('http').createServer(app.callback());
  var io = require('socket.io')(server);
  global.io = io;
  server.listen(config.socket.port);
  console.log('socket listen: ' + config.socket.port);

  return config;
};