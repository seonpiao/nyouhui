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
    var extDatas = yield Mongo.getExtData({
      collection: app.config.mongo.collections.user,
      withoutSchema: true
    });
    //外部数据的collection名需要跟用户字段名一致
    extDatas.forEach(function(extData) {
      for (var db in extData) {
        for (var collection in extData[db]) {
          result[collection] = extData[db][collection];
        }
      }
    });
    return result;
  }
}

module.exports = getUserById;
