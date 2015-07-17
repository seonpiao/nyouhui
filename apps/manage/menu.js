var Mongo = require('../../libs/server/mongodb');
var thunkify = require('thunkify');

var menu = function(app) {
  return function*(next) {
    yield next;
    var menu =
      yield Mongo.request({
        host: app.config.mongo.host,
        port: app.config.mongo.port,
        db: app.config.menu.db,
        collection: app.config.menu.collection
      });
    menu = menu[app.config.menu.db][app.config.menu.collection];
    this.global.menu = menu;
  }
};

module.exports = menu;