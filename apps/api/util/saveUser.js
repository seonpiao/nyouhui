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
      collection: app.config.mongo.collections.user,
      id: id,
      request: {
        method: method,
        json: userData
      }
    });
  };
}

module.exports = saveUser;
