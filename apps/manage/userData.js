var Mongo = require('../../libs/server/mongodb');
var thunkify = require('thunkify');

var userData = function(app) {
  return function*(next) {
    if (this.session) {
      var admin =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: app.config.admin.db,
          collection: app.config.admin.collection,
          id: this.session.uid
        });
      admin = admin[app.config.admin.db][app.config.admin.collection];
      this.global.user = admin;
    }
    yield next;
  }
};

module.exports = userData;