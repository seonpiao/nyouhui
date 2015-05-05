var request = require('request');
var thunkify = require('thunkify');
var logger = require('log4js').getLogger('manage:api');
var auth = require('../../auth');
var settings = require('../../../../settings');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var Mongo = require('../../../../libs/server/mongodb');
var extend = require('node.extend');

module.exports = function(app) {
  app.route('/crud/:db/:collection').get(function*(next) {
    var db = this.request.params.db;
    var collection = this.request.params.collection;
    try {
      var data =
        yield Mongo.request({
          host: app.config.restful.host,
          port: app.config.restful.port,
          db: db,
          collection: collection
        }, {
          qs: this.request.query
        });
      var schema =
        yield Mongo.request({
          host: app.config.restful.host,
          port: app.config.restful.port,
          db: app.config.schema.db,
          collection: app.config.schema.collection,
          one: true
        }, {
          qs: {
            query: JSON.stringify({
              db: db,
              collection: collection
            })
          }
        });
      extend(true, data, schema);
      this.result = {
        code: 200,
        result: {
          data: data,
          db: db,
          collection: collection,
          schema: app.config.schema
        }
      }
      if (fs.existsSync(path.join(__dirname, 'views', db, collection, 'index.jade'))) {
        this.view = path.join('views', db, collection, 'index');
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
      var data =
        yield Mongo.request({
          host: app.config.restful.host,
          port: app.config.restful.port,
          db: app.config.schema.db,
          collection: app.config.schema.collection,
          one: true
        }, {
          qs: {
            query: JSON.stringify({
              db: db,
              collection: collection
            })
          }
        });
      var types =
        yield Mongo.request({
          host: app.config.restful.host,
          port: app.config.restful.port,
          db: 'nyouhui',
          collection: 'extra_components'
        }, {
          qs: this.request.query
        });
      var extra_types = types.nyouhui.extra_components;
      extra_types.forEach(function(v) {
        v.params = (v.params !== '' ? JSON.parse(v.params) : {})
      })
      this.result = {
        code: 200,
        result: {
          data: data,
          types: extra_types,
          db: db,
          collection: collection,
          schema: app.config.schema
        }
      }
      if (fs.existsSync(path.join(__dirname, 'views', db, collection, 'update.jade'))) {
        this.view = path.join('views', db, collection, 'update');
      } else {
        this.view = 'update';
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
      var data =
        yield Mongo.request({
          host: app.config.restful.host,
          port: app.config.restful.port,
          db: db,
          collection: collection,
          id: id
        });
      var schema =
        yield Mongo.request({
          host: app.config.restful.host,
          port: app.config.restful.port,
          db: app.config.schema.db,
          collection: app.config.schema.collection,
          one: true
        }, {
          qs: {
            query: JSON.stringify({
              db: db,
              collection: collection
            })
          }
        });
      var types =
        yield Mongo.request({
          host: app.config.restful.host,
          port: app.config.restful.port,
          db: 'nyouhui',
          collection: 'extra_components'
        }, {
          qs: this.request.query
        });
      var extra_types = types.nyouhui.extra_components;
      extra_types.forEach(function(v) {
        v.params = (v.params !== '' ? JSON.parse(v.params) : {})
      })
      extend(true, data, schema);
      this.result = {
        code: 200,
        result: {
          data: data,
          schema: app.config.schema,
          types: extra_types,
          db: db,
          collection: collection
        }
      }
      if (fs.existsSync(path.join(__dirname, 'views', db, collection, 'update.jade'))) {
        this.view = path.join('views', db, collection, 'update');
      } else {
        this.view = 'update';
      }
    } catch (e) {
      this.result = {
        code: 500,
        message: e.message
      }
      logger.error(e.stack);
    }
  });
}