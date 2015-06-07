var request = require('request');
var Gather = require('pagegather');
var async = require('async');
var Mongo = require('../../../../../libs/server/mongodb');
var co = require('co');
var moment = require('moment');

module.exports = {
  input: ['targetStocks', 'mongo'],
  output: [],
  go: function(data, done) {
    var targetStocks = data.targetStocks;
    var db = this.params.db;
    co(function*() {
      for (var stockCode in targetStocks) {
        var fellStocks = targetStocks[stockCode];
        for (var i = 0; i < fellStocks.length; i++) {
          var fellStock = fellStocks[i];
          try {
            var result =
              yield Mongo.request({
                host: data.mongo.host,
                port: data.mongo.port,
                db: db,
                collection: 'fellstocks',
                one: true
              }, {
                qs: {
                  query: JSON.stringify({
                    code: stockCode,
                    date: fellStock.date
                  })
                }
              });
            result = result[db]['fellstocks'];
            if (result) {
              yield Mongo.request({
                host: data.mongo.host,
                port: data.mongo.port,
                db: db,
                collection: 'fellstocks',
                id: result._id + ''
              }, {
                method: 'put',
                json: {
                  code: stockCode,
                  date: fellStock.date,
                  fell_days: fellStock.fellDays,
                  marks: fellStock.marks
                }
              });
            } else {
              yield Mongo.request({
                host: data.mongo.host,
                port: data.mongo.port,
                db: db,
                collection: 'fellstocks'
              }, {
                method: 'post',
                json: {
                  code: stockCode,
                  date: fellStock.date,
                  fell_days: fellStock.fellDays,
                  marks: fellStock.marks
                }
              });
            }
          } catch (e) {}
        }
      }
    })(function() {
      done();
    })
  }
};