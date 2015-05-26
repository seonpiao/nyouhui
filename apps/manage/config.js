var session = require('koa-generic-session');
var auth = require('./auth');
var menu = require('./menu');
var jsonApi = require('./jsonApi');

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
    schema: {
      db: 'nyouhui',
      collection: 'schema'
    },
    cron: {
      db: 'nyouhui',
      collection: 'cron'
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
    control: {
      db: 'nyouhui',
      collection: 'controls'
    },
    db: {
      hosts: ['nyouhui.com']
    },
    middlewares: [session({
      cookie: {
        domain: global.DOMAIN,
        path: '/',
        maxage: 1000 * 60 * 60 * 24 * 30
      }
    }), auth, jsonApi, menu(app)]
  }
};