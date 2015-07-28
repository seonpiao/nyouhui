var Mongo = require('../../../../libs/server/mongodb');
var thunkify = require('thunkify');
var logger = require('log4js').getLogger('resource');
var parse = require('co-busboy');

module.exports = function(app) {

  var checkLogin = require('../../util/checkLogin')(app);
  var uploader = require('koa-bylh-upload')(app.config.upload);

  var route = app.route('/resource');

  route.nested('/upload').post(function*(next) {
    this.json = true;
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
      var helpId = parts.field.help_id;
      var uid = yield checkLogin.call(this, token);
      if (!uid) return;
      if (!helpId) {
        this.result = app.Errors.MISSING_PARAMS;
        return;
      }
      var result = yield uploader.call(this, part, parts.field);
      if (app.config.upload.collection) {
        result.owner = uid;
        result.type_id = typeMap[result.type] || 0;
        result.help_id = helpId;
        var db = yield Mongo.get({
          hosts: app.config.mongo.hosts.split(','),
          db: app.config.mongo.defaultDB
        });
        var collection = db.collection(app.config.upload.collection);
        var inserted = yield thunkify(collection.insert.bind(collection))(result, {
          fullResult: true
        });
        this.result = {
          code: 0,
          result: inserted.ops[0]
        }
      } else {
        logger.info(5);
        this.result = {
          code: 0,
          result: result
        }
      }
    } catch (e) {
      logger.error(e.stack);
      this.result = app.Errors.UPLOAD_FAILED;
    }
  });
};
