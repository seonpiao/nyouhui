var request = require('request');
var thunkify = require('thunkify');
var Gather = require('pagegather');
var async = require('async');
var iconv = require('iconv-lite');
var Mongo = require('../../../../../libs/server/mongodb');
var moment = require('moment');
var Retry = require('retryjs');
var co = require('co');
var padnum = require('padnum');

module.exports = {
  input: ['allStocks', 'mongo'],
  output: [],
  go: function(data, done) {
    var self = this;
    var period = this.params.period || 'day';
    async.eachLimit(data.allStocks, 1, function(stockcode, callback) {
      var subfix;
      if (stockcode.indexOf('.ss') !== -1) {
        subfix = '.ss';
        stockcode = 'SH' + stockcode.replace('.ss', '');
      } else {
        subfix = '.sz';
        stockcode = 'SZ' + stockcode.replace('.sz', '');
      }
      var timeStr = (self.params.startYear || moment().format('YYYY')) + '-' + padnum(parseInt(self.params.startMonth || moment().format('MM'), 10), 2) + '-' + padnum(parseInt(self.params.startDay || moment().add(-1, 'days').format('DD'), 10), 2) + ' 00:00:00';
      var start = new Date(timeStr).getTime();
      var url = 'http://xueqiu.com/stock/forchartk/stocklist.json?symbol=' + stockcode + '&period=1' + period + '&type=before&begin=' + start + '&end=' + Date.now();
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
          timeout: 5000,
          headers: {
            'Cookie': 'xq_a_token=a3f581098a1559bb99104bbaa893500e54d14e6a'
          }
        }, function(err, res, body) {
          if (err) {
            retry();
          } else {
            try {
              body = JSON.parse(body);
            } catch (e) {
              retry();
            }
            if (body.chartlist) {
              async.eachSeries(body.chartlist, function(item, savedOne) {
                var time = moment(new Date(item.time));
                var code = body.stock.symbol;
                code = code.replace(/SH|SZ/, '') + subfix;
                var stockData = {
                  code: code,
                  year: time.format('YYYY'),
                  month: time.format('MM'),
                  day: time.format('DD'),
                  date: time.format('YYYY-MM-DD'),
                  open: item.open,
                  close: item.close,
                  high: item.high,
                  low: item.low,
                  volume: item.volume,
                  chg: item.chg,
                  percent: item.percent,
                  turnrate: item.turnrate,
                  ma5: item.ma5,
                  ma10: item.ma10,
                  ma20: item.ma20,
                  ma30: item.ma30,
                  dif: item.dif,
                  dea: item.dea,
                  macd: item.macd
                }
                co(function*() {
                  try {
                    console.log('==============================');
                    yield Mongo.request({
                      host: data.mongo.host,
                      port: data.mongo.port,
                      db: self.params.db,
                      collection: self.params.collection
                    }, {
                      method: 'post',
                      json: stockData
                    });
                    console.log('insert: ' + stockcode + ', ' + time.format('YYYY-MM-DD'));
                  } catch (e) {
                    console.log(e.stack);
                    console.log('skip: ' + stockcode);
                  }
                })(function() {
                  savedOne();
                });
              }, finish)
            } else {
              console.log('invalid: ' + stockcode);
              finish();
            }
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