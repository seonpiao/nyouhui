var session = require('koa-generic-session');


module.exports = function(app) {

  app.keys = ['keys', 'keykeys'];

  return {
    port: '9002',
    middlewares: [session()]
  }
};