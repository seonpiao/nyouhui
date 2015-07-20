var request = require('request');
var thunkify = require('thunkify');
var logger = require('log4js').getLogger('m:api');
var Mongo = require('../../../../libs/server/mongodb');
global.moment = require('moment');

module.exports = function(app) {
  Mongo.init(app);
  app.route('/m_eventactivity/:id?').get(function*(next) {
    try {
      var id = this.request.params.id;
      var data =
        yield Mongo.concat([{
          collection: 'saishi',
          id: id
        }, {
          collection: 'saishi_list'
        }]);
      console.log(data);
      this.result = {
        result: data,
        db: app.config.mongo.defaultDB,
        collection: 'saishi'
      };
    } catch (e) {
      logger.error(e.stack);
    }
  });
}