var MongoClient = require('mongodb').MongoClient;
var format = require('util').format;
var settings = require('../../settings');
var thunkify = require('thunkify');
var assert = require('assert');

var Mongo = function() {

};

Mongo.get = function*(dbname) {
  var constr = format('mongodb://%s/%s', settings.mongodb.host.join(','), dbname);
  var db =
    yield thunkify(MongoClient.connect.bind(MongoClient))(constr, {
      db: {
        w: settings.mongodb.host.length,
        readPreference: 'secondary'
      }
    });
  assert(db);
  return db;
}


module.exports = Mongo;