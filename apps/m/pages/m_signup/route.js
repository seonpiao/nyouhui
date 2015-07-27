var request = require('request');
var thunkify = require('thunkify');
var logger = require('log4js').getLogger('manage:api');
var Mongo = require('../../../../libs/server/mongodb');

module.exports = function(app) {
  app.route('/m_signup').get(function*(next) {
    try {
      var db = 'firstre';
      var collection = 'beima_qualification';
      var data =
        yield Mongo.request({
          db: db,
          collection: collection
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
