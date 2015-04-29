var request = require('request');
var thunkify = require('thunkify');
var logger = require('log4js').getLogger('manage:api');
var auth = require('../../auth');
var settings = require('../../../../settings');
var _ = require('underscore');

module.exports = function(app) {
  app.route('/crud/:db/:collection').get(function*(next) {
    var db = this.request.params.db;
    var collection = this.request.params.collection;
    try {
      var result =
        yield thunkify(request)({
          url: 'http://' + settings.restful.host + ':' + settings.restful.port + '/' + db + '/' + collection,
          qs: this.request.query
        });
      var data = JSON.parse(result[1]);
      result =
        yield thunkify(request)({
          url: 'http://' + settings.restful.host + ':' + settings.restful.port + '/' + settings.restful.defaultDb + '/schema',
          qs: {
            query: JSON.stringify({
              db: db,
              collection: collection
            })
          }
        });
      var schema = JSON.parse(result[1])[0];
      this.result = {
        code: 200,
        data: {
          list: data,
          schema: schema,
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

  app.route('/crud/:db/:collection/create').get(function*(next) {
    var db = this.request.params.db;
    var collection = this.request.params.collection;
    try {
      var result =
        yield thunkify(request)({
          url: 'http://' + settings.restful.host + ':' + settings.restful.port + '/' + settings.restful.defaultDb + '/schema',
          qs: {
            query: JSON.stringify({
              db: db,
              collection: collection
            })
          }
        });
      var schema = JSON.parse(result[1])[0];
      this.result = {
        code: 200,
        data: {
          schema: schema,
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

  app.route('/crud/:db/:collection/update/:id').get(function*(next) {
    var db = this.request.params.db;
    var collection = this.request.params.collection;
    var id = this.request.params.id;
    try {
      var result =
        yield thunkify(request)({
          url: 'http://' + settings.restful.host + ':' + settings.restful.port + '/' + db + '/' + collection + '/' + id,
          qs: this.request.query
        });
      var data = JSON.parse(result[1]);
      result =
        yield thunkify(request)({
          url: 'http://' + settings.restful.host + ':' + settings.restful.port + '/' + settings.restful.defaultDb + '/schema',
          qs: {
            query: JSON.stringify({
              db: db,
              collection: collection
            })
          }
        });
      var schema = JSON.parse(result[1])[0];
      this.result = {
        code: 200,
        data: {
          data: data,
          schema: schema,
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