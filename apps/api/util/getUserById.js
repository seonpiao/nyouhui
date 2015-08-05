var Mongo = require('../../../libs/server/mongodb');
var extend = require('node.extend');

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
    var ext = yield Mongo.getExtData({
      collection: app.config.mongo.collections.user,
      withoutSchema: true
    });

    var extDatas = ext.extDatas;
    var extMap = ext.extMap;

    var concatedExtDatas = {};

    for (var i = 0; i < extDatas.length; i++) {
      extend(true, concatedExtDatas, extDatas[i]);
    }

    for (var fieldName in extMap) {
      var extInfo = extMap[fieldName];
      var extData = concatedExtDatas[extInfo.db][extInfo.collection];
      if (Array.isArray(result[fieldName])) {
        result[fieldName] = extData.filter(function(item) {
          delete item._id;
          delete item.create_time;
          delete item.modify_time;
          return result[fieldName].indexOf((item.id || item._id).toString()) !== -1;
        });
      } else {
        result[fieldName] = extData.filter(function(item) {
          delete item._id;
          delete item.create_time;
          delete item.modify_time;
          return result[fieldName] === (item.id || item._id).toString();
        })[0];
      }
    }

    return result;
  }
}

module.exports = getUserById;
