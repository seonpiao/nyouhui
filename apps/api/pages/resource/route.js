var Mongo = require('../../../../libs/server/mongodb');
var thunkify = require('thunkify');
var logger = require('log4js').getLogger('resource');
var parse = require('co-busboy');
var path = require('path');
var fs = require('fs');
var mime = require('mime');

module.exports = function(app) {

  var checkLogin = require('../../util/checkLogin')(app);
  var uploader = require('koa-bylh-upload')(app.config.resource);
  var save = require('../../util/save')(app);

  var route = app.route('/resource');

  route.nested('/upload').post(function*(next) {
    this.json = true;
    console.log(this.headers);
    var parts = parse(this, {
      autoFields: true
    });
    //1是图片，2是语音，3是视频，0是未知类型
    var typeMap = {
      '.jpg': 1,
      '.jpeg': 1,
      '.png': 1,
      '.gif': 1,
      '.mp4': 3
    };
    try {
      var part = yield parts;
      var token = parts.field.token;
      console.log(token);
      var helpId = parts.field.help_id;
      var overwrite = parts.field.overwrite;
      var filename = part.filename;
      var dir = parts.field.dir || '';
      var uid = yield checkLogin.call(this, token);
      if (!uid) return;
      parts.field.dir = path.join(dir, uid);
      var relPath = path.join(dir, uid, filename);
      var result = yield uploader.call(this, part, parts.field);
      if (app.config.resource.collection) {
        if (overwrite !== '1') {
          var resourceCount = yield Mongo.exec({
            collection: app.config.resource.collection
          }, 'count', {
            path: relPath,
            owner: uid
          });
          if (resourceCount > 0) {
            this.result = app.Errors.RESOURCE_DUPLICATE;
            return;
          }
        }
        result.owner = uid;
        result.type_id = typeMap[result.type] || 0;
        if (helpId) {
          result.help_id = helpId;
        }
        //资源不存储url
        delete result.url;
        result.create_time = Date.now();
        var db = yield Mongo.get({
          hosts: app.config.mongo.hosts.split(','),
          db: app.config.mongo.defaultDB
        });
        var collection = db.collection(app.config.resource.collection);
        var inserted = yield thunkify(collection.insert.bind(collection))(result, {
          fullResult: true
        });
        inserted = inserted.ops[0];
        if (helpId) {
          var helpData = yield Mongo.request({
            collection: 'sos',
            id: helpId
          });
          helpData = helpData[app.config.mongo.defaultDB]['sos'];
          if (!helpData) {
            this.result = app.Errors.RESOURCE_INVALID_HELPID;
            return;
          }
          if (!helpData.resources) {
            helpData.resources = [];
          }
          var exist = helpData.resources.filter(function(item) {
            return item.resource_id === inserted._id.toString()
          }).length > 0;
          if (!exist) {
            helpData.resources.push({
              resource_id: inserted._id.toString(),
              filename: filename
            });
          }
          yield save('sos', helpData);
        }
        this.result = {
          code: 0,
          result: inserted
        }
      } else {
        this.result = {
          code: 0,
          result: result
        }
      }
    } catch (e) {
      logger.error(e.stack);
      this.result = app.Errors.RESOURCE_UPLOAD_FAILED;
    }
  });
  route.nested('/get').get(function*(next) {
    var uid = yield checkLogin.call(this);
    if (!uid) {
      this.json = true;
      return;
    }
    var resourceId = this.request.query.resource_id;
    var resource = yield Mongo.request({
      collection: app.config.resource.collection,
      id: resourceId
    });
    resource = resource[app.config.mongo.defaultDB][app.config.resource.collection];
    if (resource) {
      var mimeType = mime.lookup(resource.type);
      if (mimeType && mimeType.match(/^image\//)) {
        this.type = resource.type;
      } else {
        this.attachment(resource.name);
      }
      var resourcePath = path.join(app.config.resource.path, resource.path);
      this.length = fs.statSync(path.join(app.config.resource.path, resource.path)).size;
      this.body = fs.createReadStream(resourcePath);
    } else {
      this.json = true;
      this.result = app.Errors.RESOURCE_NOT_FOUND;
    }
  });
};
