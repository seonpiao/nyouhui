var request = require('request');
var Gather = require('pagegather');
var async = require('async');
var Mongo = require('../../../../../libs/server/mongodb');
var co = require('co');
var moment = require('moment');

module.exports = {
  input: ['allstocks', 'felldays', 'restful', 'db', 'collection'],
  output: ['fellstocks'],
  go: function(data, done) {
    if (!data.felldays) {
      data.felldays = 5;
    }
    //取6天数据，才能计算出是不是连跌5天
    data.felldays = parseInt(data.felldays) + 1;
    var fellstocks = [];
    var count = 0;
    // data.allstocks = data.allstocks.slice(0, 50);
    async.eachLimit(data.allstocks, 1, function(stockCode, finishOne) {
      count++;
      var stockData;
      co(function*() {
        stockData =
          yield Mongo.request({
            host: data.restful.host,
            port: data.restful.port,
            db: data.db,
            collection: data.collection
          }, {
            qs: {
              query: JSON.stringify({
                code: stockCode
              })
            }
          });
        var allDays = stockData[data.db][data.collection];
        allDays.sort(function(a, b) {
          return parseInt(b.date.replace(/\-/g, '')) - parseInt(a.date.replace(/\-/g, ''))
        });
        var latestDays = allDays.slice(0, data.felldays);
        if (latestDays.length === data.felldays) {
          var isFall = latestDays.every(function(day, index) {
            if (index === latestDays.length - 1) return true;
            return day.close < latestDays[index + 1].close;
          });
          if (isFall) {
            console.log(count + ':Yes!' + stockCode);
            fellstocks.push(stockCode);
          } else {
            console.log(count + ':No!' + stockCode);
          }
        } else {
          console.log(count + ':Invalid!' + stockCode);
        }
      })(function() {
        finishOne(null, stockData);
      })
    }, function(err) {
      console.log(fellstocks)
      co(function*() {
        yield Mongo.request({
          host: data.restful.host,
          port: data.restful.port,
          db: data.db,
          collection: 'fellstocks'
        }, {
          method: 'post',
          json: {
            date: moment().format('YYYY-MM-DD'),
            stocks: fellstocks
          }
        });
        done(err)
      })()
    });
  }
};