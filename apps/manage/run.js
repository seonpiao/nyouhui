var session = require('koa-generic-session');
var auth = require('./auth');
var task = require('./task');
var userData = require('./userData');
var menu = require('./menu');
var jsonApi = require('./jsonApi');
var redisStore = require('koa-redis');
var EventEmitter = require("events").EventEmitter;

module.exports = function(app) {

  global.manage = {};

  global.manage.emitter = new EventEmitter();

  app.keys = ['firstre'];
  app.jwt_secret = 'jwt_secret_firstre';


  app.Middlewares = [session({
    store: redisStore(),
    cookie: {
      domain: global.DOMAIN,
      path: '/',
      maxage: 1000 * 60 * 60 * 24 * 30
    }
  }), auth, jsonApi, userData(app), menu(app), function*(next) {
    this.global.socket = app.config.socket
    this.global.dbs = {
      schema: {
        db: app.config.mongo.defaultDB,
        collection: app.config.mongo.collections.schema
      }
    };
    yield next;
  }, task(app)];

  var server = require('http').createServer(app.callback());
  var io = require('socket.io')(server);
  global.io = io;
  server.listen(app.config.socket.port);
  console.log('socket listen: ' + app.config.socket.port);
};
