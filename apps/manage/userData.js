var Mongo = require('../../libs/server/mongodb');
var thunkify = require('thunkify');

var userData = function(app) {
  return function*(next) {
    if (this.session) {
      var admin =
        yield Mongo.request({
          collection: app.config.mongo.collections.admin,
          id: this.session.uid
        });
      admin = admin[app.config.mongo.defaultDB][app.config.mongo.collections.admin];
      this.global.user = admin;
    }
    yield next;
  }
};

module.exports = userData;
