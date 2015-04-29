var request = require('request');
var thunkify = require('thunkify');
var logger = require('log4js').getLogger('manage:api');
var auth = require('../../auth');
var settings = require('../../../../settings');
var _ = require('underscore');

module.exports = function(app) {
  app.route('/schema').get(function*(next) {
    var db = 'nyouhui';
    var collection = 'schema';
    try {
      var result =
        yield thunkify(request)({
          url: 'http://' + settings.restful.host + ':' + settings.restful.port + '/' + db + '/' + collection,
          qs: this.request.query
        });
      var data = JSON.parse(result[1]);
      this.result = {
        code: 200,
        data: {
          list: data || [],
          db: db,
          collection: collection
        }
      }
    } catch (e) {
      this.result = {
        code: 500,
        message: e.message
      }
      logger.error(e.stack);
    }
  });

  app.route('/schema/create').get(function*(next) {
    var db = 'nyouhui';
    var collection = 'schema';
    try {
      this.result = {
        code: 200,
        data: {
          action: 'create',
          db: db,
          collection: collection
        }
      }
    } catch (e) {
      this.result = {
        code: 500,
        message: e.message
      }
      logger.error(e.stack);
    }
    this.view = 'update';
  });

  app.route('/schema/update/:id').get(function*(next) {
    var db = 'nyouhui';
    var collection = 'schema';
    var id = this.request.params.id;
    try {
      var result =
        yield thunkify(request)({
          url: 'http://' + settings.restful.host + ':' + settings.restful.port + '/' + db + '/' + collection + '/' + id,
          qs: this.request.query
        });
      var data = JSON.parse(result[1]);
      this.result = {
        code: 200,
        data: {
          action: 'update',
          data: data,
          db: db,
          collection: collection
        }
      }
    } catch (e) {
      this.result = {
        code: 500,
        message: e.message
      }
      logger.error(e.stack);
    }
    this.view = 'update';
  });
}