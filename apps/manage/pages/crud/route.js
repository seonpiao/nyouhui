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

  var getCollectionData = function*() {
    var db = this.request.params.db;
    var collection = this.request.params.collection;
    var query = this.request.query;
    var pagesize = (query.pagesize || 10) * 1;
    var page = 1;
    if (query.page >= 1) {
      page = parseInt(query.page, 10);
    }
    var skip = pagesize * (page - 1);
    query.limit = pagesize;
    query.skip = skip;
    delete query.page;
    delete query.pagesize;
    //要显示的列表数据
    var data =
      yield Mongo.request({
        db: db,
        collection: collection,
        request: {
          qs: query
        }
      });
    var list = data[db][collection];
    //列表的字段定义数据
    var _data = {};
    var extDatas = (yield Mongo.getExtData({
      collection: collection
    })).extDatas;
    for (var i = 0; i < extDatas.length; i++) {
      extend(true, _data, extDatas[i]);
    }
    yield applyCustomTemplate(list, db, collection);
    var filter = {};
    try {
      filter = JSON.parse(query.query);
    } catch (e) {}
    var count =
      yield Mongo.exec({
        collection: collection
      }, 'count', filter);
    return {
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
      },
      page: {
        total: count,
        pagesize: pagesize,
        page: page,
        ret: list.length
      }
    };
  }

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
      var result =
        yield getCollectionData.call(this);
      this.result = {
        code: 200,
        result: result
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

  app.route('/dt/:db/:collection').get(function*(next) {
    this.json = true;
    var db = this.request.params.db;
    var collection = this.request.params.collection;
    var query = this.request.query;
    if (query.iDisplayStart && query.iDisplayLength) {
      query.pagesize = query.iDisplayLength;
      query.page = Math.ceil((query.iDisplayStart * 1 + 1) / (query.iDisplayLength *
        1));
      delete query.iDisplayStart;
      delete query.iDisplayLength;
    }
    var columns = query.sColumns.split(',');
    var filter;
    if (query.sSearch) {
      filter = columns.map(function(col, index) {
        var obj = {};
        obj[col] = {
          $regex: sanitize(query.sSearch)
        };
        return obj;
      });
      filter = {
        $or: filter
      }
    }
    if (query.query) {
      try {
        query.query = JSON.parse(query.query);
      } catch (e) {
        query.query = {};
      }
      filter = filter || {};
      extend(filter, query.query);
    }
    if (filter) {
      query.query = JSON.stringify(filter);
    }
    var sortCol = columns[query.iSortCol_0 || -1];
    if (sortCol) {
      var sort = {};
      sort[sortCol] = query.sSortDir_0 === 'asc' ? 1 : -1;
      query.sort = JSON.stringify(sort);
    }
    var result =
      yield getCollectionData.call(this);
    result.sEcho = this.request.query.sEcho;
    this.result = {
      code: 200,
      result: result
    };
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
    // 后续做基础组件选择时用
    // this.global = this.global || {};
    // this.global.allModules = fs.readdirSync('modules');
    // if (this.global.allModules && this.global.allModules.length > 0) {
    //   this.global.allModules = this.global.allModules.filter(function(name) {
    //     if (name.charAt(0) != '.') {
    //       return true;
    //     }
    //     return false;
    //   });
    // }
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
