var Mongo = require('../../../libs/server/mongodb');
var extend = require('node.extend');

var getUserById = function(app) {
  return function*(uid, options) {
    options = options || {};
    var query;
    if (Array.isArray(uid)) {
      query = {
        uid: {
          $in: uid
        }
      }
    } else {
      query = {
        uid: uid
      };
    }
    if (options.filter) {
      extend(true, query, options.filter);
    }
    var result =
      yield Mongo.request({
        collection: app.config.mongo.collections.user,
        request: {
          qs: {
            query: JSON.stringify(query),
            fields: JSON.stringify(options.fields || {})
          }
        }
      });
    result = result[app.config.mongo.defaultDB][app.config.mongo.collections.user];

    if (options.withExtData) {
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

      var users = result;

      for (var fieldName in extMap) {
        var extInfo = extMap[fieldName];
        var extData = concatedExtDatas[extInfo.db][extInfo.collection];
        users.forEach(function(user) {
          if (Array.isArray(user[fieldName])) {
            user[fieldName] = extData.filter(function(item) {
              var id = (item.id || item._id).toString();
              return user[fieldName].indexOf(id) !== -1;
            }).map(function(item) {
              item = extend({}, item);
              delete item._id;
              delete item.create_time;
              delete item.modify_time;
              return item;
            });
          } else {
            user[fieldName] = extData.filter(function(item) {
              var id = (item.id || item._id).toString();
              delete item._id;
              delete item.create_time;
              delete item.modify_time;
              return user[fieldName] === id;
            }).map(function(item) {
              item = extend({}, item);
              delete item._id;
              delete item.create_time;
              delete item.modify_time;
              return item;
            })[0];
          }
        });
      }
    }
    if (!Array.isArray(uid)) {
      result = result[0];
    }

    return result;
  }
}

module.exports = getUserById;
