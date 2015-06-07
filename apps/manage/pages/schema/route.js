var request = require('request');
var thunkify = require('thunkify');
var logger = require('log4js').getLogger('manage:api');
var auth = require('../../auth');
var _ = require('underscore');
var Mongo = require('../../../../libs/server/mongodb');

module.exports = function(app) {
  app.route('/schema').get(function*(next) {
    var db = app.config.schema.db;
    var collection = app.config.schema.collection;
    try {
      var data =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: db,
          collection: collection
        }, {
          qs: this.request.query
        });
      this.result = {
        code: 200,
        result: {
          data: data || [],
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
    var db = app.config.schema.db;
    var collection = app.config.schema.collection;
    try {
      var controls =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: app.config.control.db,
          collection: app.config.control.collection
        });
      this.result = {
        code: 200,
        result: {
          action: 'create',
          db: db,
          collection: collection,
          controls: controls[app.config.control.db][app.config.control.collection]
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
    var db = app.config.schema.db;
    var collection = app.config.schema.collection;
    var id = this.request.params.id;
    try {
      var data =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: db,
          collection: collection,
          id: id
        }, {
          qs: this.request.query
        });
      var controls =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: app.config.control.db,
          collection: app.config.control.collection
        });
      this.result = {
        code: 200,
        result: {
          action: 'update',
          data: data,
          db: db,
          collection: collection,
          controls: controls[app.config.control.db][app.config.control.collection]
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