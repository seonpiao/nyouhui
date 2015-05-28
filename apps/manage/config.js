var session = require('koa-generic-session');
var auth = require('./auth');
var menu = require('./menu');
var jsonApi = require('./jsonApi');
var redisStore = require('koa-redis');

module.exports = function(app) {

  app.keys = ['nyouhui', 'cookie'];

  return {
    port: '9002',
    restful: {
      host: 'nyouhui.com',
      // host: 'localhost',
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
      hosts: ['nyouhui.com']
    },
    middlewares: [session({
      store: redisStore(),
      cookie: {
        domain: global.DOMAIN,
        path: '/',
        maxage: 1000 * 60 * 60 * 24 * 30
      }
    }), auth, jsonApi, menu(app)]
  }
};