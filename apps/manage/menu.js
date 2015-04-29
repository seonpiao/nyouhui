var Mongo = require('../../libs/server/mongodb');
var thunkify = require('thunkify');

var menu = function(app) {
  return function*(next) {
    yield next;
    var db =
      yield Mongo.get(app.config.menu.db);
    var collection = db.collection(app.config.menu.collection);
    var cursor =
      yield thunkify(collection.find.bind(collection))();
    var data =
      yield thunkify(cursor.toArray.bind(cursor))();
    this.result = this.result || {};
    this.result.data = this.result.data || {};
    this.result.data[app.config.menu.db] = this.result.data[app.config.menu.db] || {};
    this.result.data[app.config.menu.db][app.config.menu.collection] = data;
  }
};

module.exports = menu;