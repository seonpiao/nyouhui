var MongoClient = require('mongodb').MongoClient;
var format = require('util').format;
var thunkify = require('thunkify');
var assert = require('assert');
var request = require('request');
var querystring = require('querystring');
var _ = require('underscore');
var logger = require('log4js').getLogger('mongo');

var dbs = {};

var Mongo = function() {

};

var appendID = function(url, id) {
  if (id) {
    var isObjectID = !!id.match(/[a-z0-9]{24}/i);
    if (isObjectID) {
      return url + '/' + id;
    } else {
      return url + (url.indexOf('?') > 0 ? '&' : '?') + querystring.stringify({
        query: (JSON.stringify({
          id: id
        }))
      });
    }
  } else {
    return url;
  }
}

Mongo.get = function*(options) {
  var dbname = options.db;
  var hosts = options.hosts;
  if (dbs[dbname]) {
    return dbs[dbname];
  }
  var constr = format('mongodb://%s/%s', hosts.join(','), dbname);
  var db =
    yield thunkify(MongoClient.connect.bind(MongoClient))(constr, {
      db: {
        w: hosts.length,
        readPreference: 'secondary'
      }
    });
  assert(db);
  dbs[dbname] = db;
  return db;
}

Mongo.request = function*(dbOptions, requestOptions) {
  requestOptions = requestOptions || {};
  requestOptions.method = requestOptions.method || 'get';
  var requestUrl;
  if (dbOptions.path) {
    requestUrl = 'http://' + dbOptions.host + ':' + dbOptions.port + '/' + dbOptions.path;
  } else {
    requestUrl = 'http://' + dbOptions.host + ':' + dbOptions.port + '/' + dbOptions.db + '/' + dbOptions.collection;
  }
  requestUrl = appendID(requestUrl, dbOptions.id);
  _.extend(requestOptions, {
    url: requestUrl
  });
  var result =
    yield thunkify(request)(requestOptions);
  //mongo rest 返回的直接就是对象
  if (_.isObject(result[1])) {
    result = result[1];
  } else {
    try {
      result = JSON.parse(result[1]);
    } catch (e) {
      logger.error(result[1]);
      logger.error(e.stack);
    }
  }
  if (requestOptions.method !== 'get' && !result.ok) {
    throw new Error('operation failed');
  }
  //如果传了id，就只返回一条
  if (dbOptions.id) {
    dbOptions.one = true;
  }
  if (dbOptions.one && Array.isArray(result)) {
    result = result[0];
  }
  var data = {};
  data[dbOptions.db] = {};
  data[dbOptions.db][dbOptions.collection] = result;
  return data;
};

module.exports = Mongo;