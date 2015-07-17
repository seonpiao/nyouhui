var request = require('request');
var thunkify = require('thunkify');
var logger = require('log4js').getLogger('m:api');
var Mongo = require('../../../../libs/server/mongodb');
global.moment = require('moment');

module.exports = function(app) {
  app.route('/m_eventactivity/:id?').get(function*(next) {
    try {
      var id = this.request.params.id;
      var db = 'firstre';
      var collection = 'saishi';
      var data =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: db,
          collection: collection,
          id: id
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