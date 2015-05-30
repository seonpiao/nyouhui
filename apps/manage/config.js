var session = require('koa-generic-session');
var auth = require('./auth');
var task = require('./task');
var menu = require('./menu');
var jsonApi = require('./jsonApi');
var redisStore = require('koa-redis');

module.exports = function(app) {

  app.keys = ['nyouhui', 'cookie'];
  app.jwt_secret = 'jwt_secret_carrier';

  var config = {
    port: '9002',
    socket: {
      host: 'localhost',
      port: 3001
    },
    restful: {
      // host: 'nyouhui.com',
      host: 'localhost',
      port: 3000,
      defaultDb: 'nyouhui'
    },
    redis: {
      host: 'localhost',
      port: 6379
    },
    schema: {
      db: 'nyouhui',
      collection: 'schema'
    },
    admins: {
      db: 'nyouhui',
      collection: 'admins'
    },
    users: {
      db: 'nyouhui',
      collection: 'users'
    },
    menu: {
      db: 'nyouhui',
      collection: 'manage_menu'
    },
    step: {
      db: 'nyouhui',
      collection: 'step'
    },
    task: {
      db: 'nyouhui',
      collection: 'task'
    },
    tasklog: {
      db: 'nyouhui',
      collection: 'tasklog'
    },
    control: {
      db: 'nyouhui',
      collection: 'controls'
    },
    db: {
      // hosts: ['nyouhui.com']
      hosts: ['localhost']
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