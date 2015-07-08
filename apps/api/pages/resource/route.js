var Mongo = require('../../../../libs/server/mongodb');
var thunkify = require('thunkify');
var logger = require('log4js').getLogger('resource');

module.exports = function(app) {

  var checkLogin = require('../../util/checkLogin')(app);
  var uploader = require('koa-bylh-upload')({
    host: app.config.upload.host,
    path: app.config.upload.path
  });

  var route = app.route('/resource');

  route.nested('/upload').post(function*(next) {
    this.json = true;
    var uid =
      yield checkLogin.call(this);
    if (!uid) return;
    try {
      var result = yield uploader.call(this);
      if (app.config.upload.db && app.config.upload.collection) {
        var db = yield Mongo.get({
          hosts: app.config.mongo.replset.split(','),
          db: app.config.upload.db
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