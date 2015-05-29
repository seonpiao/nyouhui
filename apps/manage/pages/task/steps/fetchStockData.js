var request = require('request');
var thunkify = require('thunkify');
var Gather = require('pagegather');
var async = require('async');
var iconv = require('iconv-lite');
var Mongo = require('../../../../../libs/server/mongodb');
var moment = require('moment');
var Retry = require('retryjs');
var co = require('co');

module.exports = {
  input: ['allstocks', 'db', 'collection', 'restful', 'startYear', 'startMonth', 'startDay'],
  output: [],
  go: function(data, done) {
    async.eachLimit(data.allstocks, 1, function(stockcode, callback) {
      var url = 'http://table.finance.yahoo.com/table.csv?s=' + stockcode + '&g=d&a=' + (parseInt(data.startMonth || moment().format('MM'), 10) - 1) + '&b=' + parseInt(data.startDay || moment().add(-1, 'days').format('DD'), 10) + '&c=' + (data.startYear || moment().format('YYYY')) + '&ignore=.csv';
      var retry = new Retry({
        max: 5,
        done: callback,
        fail: function() {
          console.log(url);
          callback();
        }
      });
      retry.start(function(finish, retry) {
        request({
          url: url,
          timeout: 5000
        }, function(err, res, body) {
          if (err) {
            retry();
          } else {
            var stockArray = body.split('\n').slice(1);
            async.eachSeries(stockArray, function(item, savedOne) {
              if (item.match(/\d+\-\d+\-\d+,\d+\.\d+,\d+\.\d+,\d+\.\d+,\d+\.\d+,\d+,\d+\.\d+/)) {
                var dataArr = item.split(',');
                var dateArr = dataArr[0].split('-');
                var stockData = {
                  code: stockcode,
                  year: dateArr[0],
                  month: dateArr[1],
                  day: dateArr[2],
                  date: dataArr[0],
                  open: dataArr[1],
                  close: dataArr[4],
                  high: dataArr[2],
                  low: dataArr[3],
                  volume: dataArr[5]
                }
                co(function*() {
                  try {
                    console.log('==============================');
                    yield Mongo.request({
                      host: data.restful.host,
                      port: data.restful.port,
                      db: data.db,
                      collection: data.collection
                    }, {
                      method: 'post',
                      json: true,
                      body: stockData
                    });
                    console.log('insert: ' + stockcode + ', ' + dataArr[0]);
                  } catch (e) {
                    console.log('skip: ' + stockcode);
                  }
                  savedOne();
                })();
              } else {
                savedOne();
              }
            }, finish)
          }
        });
      });
    }, function(err) {
      if (err) {
        console.log(err)
      }
      done(err);
    });
  }
};