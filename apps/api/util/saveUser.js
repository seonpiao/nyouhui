var Mongo = require('../../../libs/server/mongodb');

var saveUser = function(app) {
  return function*(userData) {
    var id = userData._id;
    var method = 'post';
    if (userData._id) {
      delete userData._id;
      method = 'put';
    }
    yield Mongo.request({
      host: app.config.mongo.host,
      port: app.config.mongo.port,
      db: app.config.user.db,
      collection: app.config.user.collection,
      id: id,
      request: {
        method: method,
        json: userData
      }
    });
  };
}

module.exports = saveUser;
