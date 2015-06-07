var request = require('request');
var Gather = require('pagegather');
var Mongo = require('../../../../../libs/server/mongodb');
var co = require('co');
var thunkify = require('thunkify');
var async = require('async');

module.exports = {
  input: ['allStocks', 'mongo'],
  output: ['allStockDatas'],
  go: function(data, done) {
    var allStockDatas = {};
    var db = this.params.db;
    var collection = this.params.collection;
    var count = 0;
    var max = Infinity;
    // var max = 1000;
    async.eachLimit(data.allStocks.slice(0, max), 4, function(stockCode, finishOne) {
      var stockData;
      co(function*() {
        stockData =
          yield Mongo.request({
            host: data.mongo.host,
            port: data.mongo.port,
            db: db,
            collection: collection
          }, {
            qs: {
              query: JSON.stringify({
                code: stockCode
              })
            }
          });
        var allDays = stockData[db][collection];
        if (allDays) {
          allStockDatas[stockCode] = allDays;
          // for (var i = 0; i < allDays.length; i++) {
          //   if (allDays[i].code.match(/^S/)) {
          //     allDays[i].code = allDays[i].code.replace(/^S/, '');
          //     var objectId = allDays[i]._id;
          //     delete allDays[i]._id;
          //     console.log(allDays[i]._id, allDays[i])
          //     yield Mongo.request({
          //       host: data.mongo.host,
          //       port: data.mongo.port,
          //       db: db,
          //       collection: collection,
          //       id: objectId
          //     }, {
          //       method: 'put',
          //       json: allDays[i]
          //     });
          //   }
          // }
        }
      })(function() {
        console.log('Finish reading: ' + ++count);
        finishOne();
      })
    }, function(err) {
      done(null, {
        allStockDatas: allStockDatas
      })
    });
  }
};