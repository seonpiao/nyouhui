var Mongo = require('../../libs/server/mongodb');

var getUserById = function(app) {
  return function*(uid) {
    var result =
      yield Mongo.request({
        host: app.config.restful.host,
        port: app.config.restful.port,
        db: app.config.users.db,
        collection: app.config.users.collection,
        one: true
      }, {
        qs: {
          query: JSON.stringify({
            uid: uid
          })
        }
      });
    result = result[app.config.users.db][app.config.users.collection];
    return result;
  }
}

module.exports = getUserById;