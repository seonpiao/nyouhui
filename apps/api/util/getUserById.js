var Mongo = require('../../../libs/server/mongodb');

var getUserById = function(app) {
  return function*(uid, options) {
    options = options || {};
    var result =
      yield Mongo.request({
        collection: app.config.mongo.collections.user,
        one: true,
        request: {
          qs: {
            query: JSON.stringify({
              uid: uid
            }),
            fields: JSON.stringify(options.fields || {})
          }
        }
      });
    result = result[app.config.mongo.defaultDB][app.config.mongo.collections.user];
    return result;
  }
}

module.exports = getUserById;
