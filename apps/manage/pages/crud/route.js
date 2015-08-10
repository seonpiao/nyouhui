var request = require('request');
var thunkify = require('thunkify');
var logger = require('log4js').getLogger('manage:api');
var auth = require('../../auth');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var Mongo = require('../../../../libs/server/mongodb');
var extend = require('node.extend');
var co = require('co');
var jade = require('jade');

module.exports = function(app) {

  var sanitize = function(s) {
    return s.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  }

  var applyCustomTemplate = function*(list, db, collection) {
    var schema =
      yield Mongo.request({
        collection: app.config.mongo.collections.schema,
        one: true,
        request: {
          qs: {
            query: JSON.stringify({
              db: db,
              collection: collection
            })
          }
        }
      });
    var schemaData = schema[app.config.mongo.defaultDB][app.config.mongo.collections.schema];
    if (schemaData) {
      var fields = schemaData.fields;
      //检查有哪些自定义的模板
      var templates = {};
      fields.forEach(function(field) {
        if (field.template) {
          templates[field.name] = field.template;
        }
      });
      Object.keys(templates).forEach(function(fieldName) {
        list.forEach(function(row) {
          row[fieldName] = jade.render(templates[fieldName], row);
        });
      });
    }
  };

  app.route('/crud/:db/:collection').get(function*(next) {
    var db = this.request.params.db;
    var collection = this.request.params.collection;
    var hasPermission = true;
    try {
      var privilege = JSON.parse(this.global.user.privilege);
      hasPermission = !!privilege[db][collection].read;
    } catch (e) {}
    if (!hasPermission) {
      this.status = 403;
      return;
    }
    try {
      var result = yield Mongo.request({
        collection: app.config.mongo.collections.schema,
        one: true,
        request: {
          qs: {
            query: JSON.stringify({
              db: db,
              collection: collection
            })
          }
        }
      });
      this.result = {
        code: 200,
        result: result[app.config.mongo.defaultDB][app.config.mongo.collections.schema]
      }
      if (fs.existsSync(path.join(__dirname, 'views', db, collection,
          'index.jade'))) {
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
    var hasPermission = true;
    try {
      var privilege = JSON.parse(this.global.user.privilege);
      hasPermission = !!privilege[db][collection].read;
    } catch (e) {}
    if (!hasPermission) {
      this.status = 403;
      return;
    }
    try {
      //table data
      var data =
        yield Mongo.request({
          collection: app.config.mongo.collections.schema,
          one: true,
          request: {
            qs: {
              query: JSON.stringify({
                db: db,
                collection: collection
              })
            }
          }
        });

      //private internal data
      var _data = {};
      var schema =
        yield Mongo.request({
          collection: app.config.mongo.collections.schema,
          one: true,
          request: {
            qs: {
              query: JSON.stringify({
                db: db,
                collection: collection
              })
            }
          }
        });
      var schemaData = schema[app.config.mongo.defaultDB][app.config.mongo.collections.schema];
      var fields = schemaData.fields;
      var extDatas = (yield Mongo.getExtData({
        collection: collection
      })).extDatas;
      extDatas.forEach(function(extData) {
        extend(true, _data, extData);
      });
      extend(true, _data, schema);
      var controls =
        yield Mongo.request({
          collection: app.config.mongo.collections.control
        });
      controls[app.config.mongo.defaultDB][app.config.mongo.collections.control].forEach(
        function(control) {
          try {
            control.params = (control.params !== '' ? JSON.parse(
              control.params) : {});
          } catch (e) {}
        });
      extend(true, _data, controls);
      this.result = {
        code: 200,
        result: {
          data: data,
          _data: _data,
          db: db,
          collection: collection,
          config: {
            schema: {
              db: app.config.mongo.defaultDB,
              collection: app.config.mongo.collections.schema
            },
            control: {
              db: app.config.mongo.defaultDB,
              collection: app.config.mongo.collections.control
            }
          }
        }
      }
      if (fs.existsSync(path.join(__dirname, 'views', db, collection,
          'update.jade'))) {
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
    var hasPermission = true;
    try {
      var privilege = JSON.parse(this.global.user.privilege);
      hasPermission = !!privilege[db][collection].read;
    } catch (e) {}
    if (!hasPermission) {
      this.status = 403;
      return;
    }
    var id = this.request.params.id;
    try {
      //table data
      var data =
        yield Mongo.request({
          db: db,
          collection: collection,
          id: id
        });
      //private internal data
      var _data = {};
      var schema =
        yield Mongo.request({
          collection: app.config.mongo.collections.schema,
          one: true,
          request: {
            qs: {
              query: JSON.stringify({
                db: db,
                collection: collection
              })
            }
          }
        });
      var schemaData = schema[app.config.mongo.defaultDB][app.config.mongo.collections.schema];
      var fields = schemaData.fields;
      var extDatas = (yield Mongo.getExtData({
        collection: collection
      })).extDatas;
      extDatas.forEach(function(extData) {
        extend(true, _data, extData);
      });
      extend(true, _data, schema);
      var controls =
        yield Mongo.request({
          collection: app.config.mongo.collections.control
        });
      controls[app.config.mongo.defaultDB][app.config.mongo.collections.control].forEach(
        function(control) {
          try {
            control.params = (control.params !== '' ? JSON.parse(
              control.params) : {});
          } catch (e) {}
        });
      extend(true, _data, controls);
      this.result = {
        code: 200,
        result: {
          data: data,
          _data: _data,
          config: {
            schema: {
              db: app.config.mongo.defaultDB,
              collection: app.config.mongo.collections.schema
            },
            control: {
              db: app.config.mongo.defaultDB,
              collection: app.config.mongo.collections.control
            }
          },
          db: db,
          collection: collection
        }
      }
      if (fs.existsSync(path.join(__dirname, 'views', db, collection,
          'update.jade'))) {
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
