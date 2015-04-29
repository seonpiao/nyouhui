module.exports = {
  api: {
    apiBase: 'http://api.mm.' + global.WLY_DOMAIN,
    accountApiBase: 'http://account.' + global.WLY_DOMAIN,
  },
  http: {
    timeout: 5000
  },
  restful: {
    host: 'localhost',
    port: 3000,
    defaultDb: 'nyouhui'
  },
  mongodb: {
    host: ['localhost']
  }
};