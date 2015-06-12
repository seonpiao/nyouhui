module.exports = function(app) {

  var config = {
    name: '北京马拉松',
    port: '8000',
    mongo: {
      host: 'localhost',
      port: 3000,
      replset: 'localhost',
      defaultDB: 'firstre'
    },
    redis: {
      host: 'localhost',
      port: 6379
    }
  }

  return config;
};