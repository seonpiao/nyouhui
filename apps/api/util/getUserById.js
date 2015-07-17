var Mongo = require('../../../libs/server/mongodb');

var getUserById = function(app) {
  return function*(uid) {
    var result =
      yield Mongo.request({
        host: app.config.mongo.host,
        port: app.config.mongo.port,
        db: app.config.user.db,
        collection: app.config.user.collection,
        one: true,
        request: {
          qs: {
            query: JSON.stringify({
              uid: uid
            })
          }
        }
      });
    result = result[app.config.user.db][app.config.user.collection];
    return result;
  }
}

module.exports = getUserById;
