var request = require('request');
var thunkify = require('thunkify');
var logger = require('log4js').getLogger('manage:api');
var auth = require('../../auth');
var _ = require('underscore');
var Mongo = require('../../../../libs/server/mongodb');

module.exports = function(app) {
  app.route('/schema').get(function*(next) {
    if (this.session.username !== 'root') {
      this.status = 403;
      return;
    }
    var db = app.config.mongo.defaultDB;
    var collection = app.config.mongo.collections.schema;
    try {
      var data =
        yield Mongo.request({
          db: db,
          collection: collection,
          request: {
            qs: this.request.query
          }
        });
      this.result = {
        code: 200,
        result: {
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
  });

  app.route('/schema/create').get(function*(next) {
    var db = app.config.mongo.defaultDB;
    var collection = app.config.mongo.collections.schema;
    try {
      var controls =
        yield Mongo.request({
          collection: app.config.mongo.collections.control
        });
      this.result = {
        code: 200,
        result: {
          action: 'create',
          db: db,
          collection: collection,
          controls: controls[app.config.mongo.defaultDB][app.config.mongo.collections.control]
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
    var db = app.config.mongo.defaultDB;
    var collection = app.config.mongo.collections.schema;
    var id = this.request.params.id;
    try {
      var data =
        yield Mongo.request({
          db: db,
          collection: collection,
          id: id,
          request: {
            qs: this.request.query
          }
        });
      var controls =
        yield Mongo.request({
          collection: app.config.mongo.collections.control
        });
      this.result = {
        code: 200,
        result: {
          action: 'update',
          data: data,
          db: db,
          collection: collection,
          controls: controls[app.config.mongo.defaultDB][app.config.mongo.collections.control]
        }
      };
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
