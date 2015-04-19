var session = require('koa-generic-session');
var auth = require('./auth');

module.exports = function(app) {

  app.keys = ['nyouhui', 'cookie'];

  return {
    port: '9002',
    middlewares: [session(), auth]
  }
};