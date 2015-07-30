var request = require('request');
var thunkify = require('thunkify');
var logger = require('log4js').getLogger('m:api');
var Mongo = require('../../../../libs/server/mongodb');
global.moment = require('moment');

module.exports = function(app) {
  app.route('/m_article/:id?').get(function*(next) {
    try {
      var id = this.request.params.id;
      var collection = this.request.query.collection;
      var data =
        yield Mongo.concat([{
          collection: collection,
          id: id
        }, {
          collection: collection + '_type'
        }]);
      console.log(data);
      this.result = {
        result: data,
        db: app.config.mongo.defaultDB,
        collection: collection
      };
    } catch (e) {
      logger.error(e.stack);
    }
  });
}
