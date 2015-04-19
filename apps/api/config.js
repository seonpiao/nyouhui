var cors = require('koa-cors');

module.exports = function(app) {
  return {
    port: '9003',
    middlewares: [cors()]
  }
};