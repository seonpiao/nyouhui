var Mongo = require('../../libs/server/mongodb');
var thunkify = require('thunkify');

var userData = function(app) {
  return function*(next) {
    var admin;
    if (this.session) {
      if (this.session.username === app.config.root.username) {
        admin = app.config.root;
      } else {
        admin =
          yield Mongo.request({
            collection: app.config.mongo.collections.admin,
            one: true,
            request: {
              qs: {
                query: JSON.stringify({
                  username: this.session.username
                })
              }
            }
          });
        admin = admin[app.config.mongo.defaultDB][app.config.mongo.collections.admin];
      }
      this.global.user = admin;
    }
    yield next;
  }
};

module.exports = userData;
