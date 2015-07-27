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
        collection: app.config.mongo.collections.user,
        request: {
          qs: {
            query: JSON.stringify(query)
          }
        }
      });
    result = result[app.config.mongo.defaultDB][app.config.mongo.collections.user];
    if (result && result.length === 1) {
      return result[0];
    } else {
      return false;
    }
  };
};

module.exports = auth;
