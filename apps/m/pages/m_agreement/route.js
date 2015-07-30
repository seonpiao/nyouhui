var request = require('request');
var thunkify = require('thunkify');
var logger = require('log4js').getLogger('m:api');
var Mongo = require('../../../../libs/server/mongodb');

module.exports = function(app) {
  app.route('/m_agreement').get(function*(next) {
    try {
      var data =
        yield Mongo.request({
          collection: 'agreement',
          one: true
        });

      data = data[app.config.mongo.defaultDB]['agreement'];
      this.result = {
        result: data,
        db: app.config.mongo.defaultDB,
        collection: 'agreement'
      };
    } catch (e) {
      logger.error(e.stack);
    }
  });
}
