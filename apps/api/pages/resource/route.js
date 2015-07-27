var Mongo = require('../../../../libs/server/mongodb');
var thunkify = require('thunkify');
var logger = require('log4js').getLogger('resource');

module.exports = function(app) {

  var checkLogin = require('../../util/checkLogin')(app);
  var uploader = require('koa-bylh-upload')(app.config.upload);

  var route = app.route('/resource');

  route.nested('/upload').post(function*(next) {
    this.json = true;
    var uid =
      yield checkLogin.call(this);
    if (!uid) return;
    var parts = this.parts;
    var helpId = parts.field.help_id;
    //1是图片，2是语音，3是视频，0是未知类型
    var typeMap = {
      '.jpg': 1,
      '.jpeg': 1,
      '.png': 1,
      '.gif': 1,
      '.mp4': 3
    };
    try {
      logger.info(1);
      var result = yield uploader.call(this);
      logger.info(2);
      if (app.config.upload.collection) {
        logger.info(3);
        result.owner = uid;
        result.type_id = typeMap[result.type] || 0;
        result.help_id = helpId;
        var db = yield Mongo.get({
          hosts: app.config.mongo.hosts.split(','),
          db: app.config.mongo.defaultDB
        });
        var collection = db.collection(app.config.upload.collection);
        var inserted = yield thunkify(collection.insert.bind(collection))
          (result, {
            fullResult: true
          });
        logger.info(4);
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
