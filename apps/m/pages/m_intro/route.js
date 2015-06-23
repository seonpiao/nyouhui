var request = require('request');
var thunkify = require('thunkify');
var logger = require('log4js').getLogger('manage:api');
var Mongo = require('../../../../libs/server/mongodb');

module.exports = function(app) {
  app.route('/m_intro').get(function*(next) {
    try {
      var db = 'firstre';
      var collection = 'beima_intro';
      var data =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: db,
          collection: collection,
          one: true
        });
      this.result = {
        result: data,
        db: db,
        collection: collection
      };
    } catch (e) {
      logger.error(e.stack);
    }
  });
}