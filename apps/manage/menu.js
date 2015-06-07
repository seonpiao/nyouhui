var Mongo = require('../../libs/server/mongodb');
var thunkify = require('thunkify');

var menu = function(app) {
  return function*(next) {
    yield next;
    if (!this.json && !this.text && !this.raw) {
      var menu =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: app.config.menu.db,
          collection: app.config.menu.collection
        });
      menu = menu[app.config.menu.db][app.config.menu.collection];
      this.result = this.result || {};
      this.result.result = this.result.result || {};
      this.result.result.menu = menu;
    }
  }
};

module.exports = menu;