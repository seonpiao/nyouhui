var session = require('koa-generic-session');
var auth = require('./auth');
var menu = require('./menu');
var jsonApi = require('./jsonApi');

module.exports = function(app) {

  app.keys = ['nyouhui', 'cookie'];

  return {
    port: '9002',
    schema: {
      db: 'nyouhui',
      collection: 'schema'
    },
    admins: {
      db: 'nyouhui',
      collection: 'admins'
    },
    menu: {
      db: 'nyouhui',
      collection: 'manage_menu'
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