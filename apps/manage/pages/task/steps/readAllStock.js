var request = require('request');
var Gather = require('pagegather');
var Mongo = require('../../../../../libs/server/mongodb');
var co = require('co');
var thunkify = require('thunkify');

module.exports = {
  input: ['mongo'],
  output: ['allStocks'],
  go: function(data, done) {
    var db = this.params.db;
    var collection = this.params.collection;
    var stocks = [];
    co(function*() {
      var conn =
        yield Mongo.get({
          db: db,
          hosts: data.mongo.replset.split(',')
        });
      var coll = conn.collection(collection);
      stocks =
        yield thunkify(coll.distinct.bind(coll))('code');
    })(function() {
      done(null, {
        allStocks: stocks
      })
    });
  }
};