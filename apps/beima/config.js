module.exports = function(app) {

  var config = {
    name: '北京马拉松',
    port: '9004',
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