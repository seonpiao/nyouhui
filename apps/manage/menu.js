var Mongo = require('../../libs/server/mongodb');
var thunkify = require('thunkify');

var menu = function(app) {
  return function*(next) {
    yield next;
    var menu =
      yield Mongo.request({
        collection: app.config.mongo.collections.menu
      });
    menu = menu[app.config.mongo.defaultDB][app.config.mongo.collections.menu];
    this.global.menu = menu;
  }
};

module.exports = menu;
