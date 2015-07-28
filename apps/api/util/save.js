var Mongo = require('../../../libs/server/mongodb');

var save = function(app) {
  return function*(collection, data) {
    var id = data._id;
    var method = 'post';
    if (data._id) {
      delete data._id;
      method = 'put';
    }
    yield Mongo.request({
      collection: collection,
      id: id,
      request: {
        method: method,
        json: data
      }
    });
  };
}

module.exports = save;
