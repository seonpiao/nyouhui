var cors = require('koa-cors');

module.exports = function(app) {
  return {
    port: '9003',
    restful: {
      host: 'nyouhui.com',
      port: 3000,
      defaultDb: 'nyouhui'
    },
    middlewares: [cors()]
  }
};