var session = require('koa-generic-session');


module.exports = function(app) {

  app.keys = ['nyouhui', 'cookie'];

  return {
    port: '9002',
    middlewares: [session()]
  }
};