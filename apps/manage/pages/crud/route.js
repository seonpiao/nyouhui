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

  var getFieldExtData = function*(fields) {
    var extDatas = [];
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      //从controls表里面，获取字段的附件数据
      var fieldExtData =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: app.config.control.db,
          collection: app.config.control.collection,
          id: field.type
        });
      fieldExtData = fieldExtData[app.config.control.db][app.config.control.collection];
      if (fieldExtData) {
        var fieldParams = fieldExtData.params;
        if (fieldParams) {
          try {
            fieldParams = JSON.parse(fieldParams);
          } catch (e) {
            fieldParams = {};
          }
          //有db和collection，说明这个字段的数据是与外表有关联的
          if (fieldParams.db && fieldParams.collection) {
            //把db和collection附加到field定义上，表名这个字段有关联的外表数据
            field.db = fieldParams.db;
            field.collection = fieldParams.collection;
            var fieldData =
              yield Mongo.request({
                host: app.config.mongo.host,
                port: app.config.mongo.port,
                db: fieldParams.db,
                collection: fieldParams.collection
              });
            extDatas.push(fieldData);
          }
        }
      }
    }
    return extDatas;
  };

  var getCollectionData = function*() {
    var db = this.request.params.db;
    var collection = this.request.params.collection;
    var query = this.request.query;
    var pagesize = query.pagesize || 10;
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
        host: app.config.mongo.host,
        port: app.config.mongo.port,
        db: db,
        collection: collection
      }, {
        qs: query
      });
    var list = data[db][collection];
    //列表的字段定义数据
    var _data = {};
    var schema =
      yield Mongo.request({
        host: app.config.mongo.host,
        port: app.config.mongo.port,
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
    var schemaData = schema[app.config.schema.db][app.config.schema.collection];
    var fields = schemaData.fields;
    //下面是要获取有外联的字段的附加数据
    //获取到关联的外表数据
    var extDatas =
      yield getFieldExtData(fields);
    extDatas.forEach(function(extData) {
      extend(true, _data, extData);
    });
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
    extend(true, _data, schema);
    var dbconn =
      yield Mongo.get({
        db: db,
        hosts: app.config.mongo.replset.split(',')
      });
    var coll = dbconn.collection(collection);
    var filter = {};
    try {
      filter = JSON.parse(query.query);
    } catch (e) {}
    var count =
      yield thunkify(coll.count.bind(coll))(filter);
    return {
      data: data,
      _data: _data,
      db: db,
      collection: collection,
      config: {
        schema: app.config.schema,
        control: app.config.control
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
    try {
      var result =
        yield getCollectionData.call(this);
      this.result = {
        code: 200,
        result: result
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

  app.route('/dt/:db/:collection').get(function*(next) {
    this.json = true;
    var db = this.request.params.db;
    var collection = this.request.params.collection;
    var query = this.request.query;
    if (!query.page && query.iDisplayStart && query.iDisplayLength) {
      query.pagesize = query.iDisplayLength;
      query.page = Math.ceil((query.iDisplayStart * 1 + 1) / (query.iDisplayLength * 1));
      delete query.iDisplayStart;
      delete query.iDisplayLength;
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
          host: app.config.mongo.host,
          port: app.config.mongo.port,
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

      //private internal data
      var _data = {};
      var schema =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
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
      var schemaData = schema[app.config.schema.db][app.config.schema.collection];
      var fields = schemaData.fields;
      var extDatas =
        yield getFieldExtData(fields);
      extDatas.forEach(function(extData) {
        extend(true, _data, extData);
      });
      extend(true, _data, schema);
      var controls =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: app.config.control.db,
          collection: app.config.control.collection
        });
      controls[app.config.control.db][app.config.control.collection].forEach(function(control) {
        try {
          control.params = (control.params !== '' ? JSON.parse(control.params) : {});
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
            schema: app.config.schema,
            control: app.config.control
          }
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
      //table data
      var data =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: db,
          collection: collection,
          id: id
        });
      //private internal data
      var _data = {};
      var schema =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
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
      var schemaData = schema[app.config.schema.db][app.config.schema.collection];
      var fields = schemaData.fields;
      var extDatas =
        yield getFieldExtData(fields);
      extDatas.forEach(function(extData) {
        extend(true, _data, extData);
      });
      extend(true, _data, schema);
      var controls =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: app.config.control.db,
          collection: app.config.control.collection
        });
      controls[app.config.control.db][app.config.control.collection].forEach(function(control) {
        try {
          control.params = (control.params !== '' ? JSON.parse(control.params) : {});
        } catch (e) {}
      });
      extend(true, _data, controls);
      this.result = {
        code: 200,
        result: {
          data: data,
          _data: _data,
          config: {
            schema: app.config.schema,
            control: app.config.control
          },
          schema: app.config.schema,
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