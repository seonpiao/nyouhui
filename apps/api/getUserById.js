var Mongo = require('../../libs/server/mongodb');

var getUserById = function(app) {
  return function*(uid) {
    var result =
      yield Mongo.request({
        host: app.config.restful.host,
        port: app.config.restful.port,
        db: app.config.user.db,
        collection: app.config.user.collection,
        one: true
      }, {
        qs: {
          query: JSON.stringify({
            uid: uid
          })
        }
      });
    result = result[app.config.user.db][app.config.user.collection];
    return result;
  }
}

module.exports = getUserById;