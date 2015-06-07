var Mongo = require('../../../libs/server/mongodb');
var crypto = require('crypto');

var sha1 = function(str) {
  var shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex')
}

var auth = function(app) {
  return function*(phone, password) {
    password = sha1(password);
    var query = {
      password: password
    };
    if (phone.length === 11) {
      query.phone = phone;
    } else if (phone.length === 12) {
      query.uid = phone;
    }
    var result =
      yield Mongo.request({
        host: app.config.mongo.host,
        port: app.config.mongo.port,
        db: app.config.user.db,
        collection: app.config.user.collection
      }, {
        qs: {
          query: JSON.stringify(query)
        }
      });
    result = result[app.config.user.db][app.config.user.collection];
    if (result && result.length === 1) {
      return result[0];
    } else {
      return false;
    }
  };
};

module.exports = auth;