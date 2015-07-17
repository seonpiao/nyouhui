var request = require('request');
var thunkify = require('thunkify');
var logger = require('log4js').getLogger('manage:api');
var Mongo = require('../../../../libs/server/mongodb');

module.exports = function(app) {
  app.route('/kangbao_show').get(function*(next) {
    var id = this.request.query.id;
    try {
      var db = 'kangbao';
      var collection = 'uploadimg';
      var data =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: db,
          collection: collection,
          one: true,
          request: {
            qs: {
              query: JSON.stringify({
                media_id: id
              })
            }
          }
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
