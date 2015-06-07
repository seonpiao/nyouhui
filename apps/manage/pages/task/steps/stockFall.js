var request = require('request');
var Gather = require('pagegather');
var async = require('async');
var Mongo = require('../../../../../libs/server/mongodb');
var co = require('co');
var moment = require('moment');

module.exports = {
  input: ['allStocks', 'allStockDatas', 'mongo', 'date'],
  output: ['targetStocks'],
  go: function(data, done) {
    var minFellDays = 5;
    var db = this.params.db;
    var collection = this.params.collection;
    var date = data.date;
    if (this.params.fellDays) {
      minFellDays = this.params.fellDays;
    }
    var targetStocks = {};
    var count = 0;
    async.eachLimit(data.allStocks, 1, function(stockCode, finishOne) {
      count++;
      var allDays = data.allStockDatas[stockCode];
      if (allDays) {
        allDays.sort(function(a, b) {
          return parseInt(b.date.replace(/\-/g, '')) - parseInt(a.date.replace(/\-/g, ''))
        });
        var days = [{
          stockData: allDays[0],
          index: 0,
          date: allDays[0].date
        }];
        if (date) {
          var days = [];
          if (Array.isArray(date)) {
            allDays.forEach(function(day, index) {
              if (date.indexOf(day.date) !== -1) {
                days.push({
                  stockData: day,
                  index: index,
                  date: day.date
                });
              }
            });
          } else if (date.match(/^\d+\-\d+\-\d+$/)) {
            allDays.forEach(function(day, index) {
              if (day.date === date) {
                days.push({
                  stockData: day,
                  index: index,
                  date: day.date
                });
              }
            });
          } else if (date.indexOf('~') !== -1) {
            var arr = date.split('~');
            var start = arr[0].trim(),
              end = arr[1].trim()
            allDays.forEach(function(day, index) {
              if (day.date >= start && day.date <= end) {
                days.push({
                  stockData: day,
                  index: index,
                  date: day.date
                });
              }
            });
          } else if (date === '*') {
            days = allDays.map(function(day, index) {
              return {
                stockData: day,
                index: index,
                date: day.date
              }
            });
          }
        }
        days.forEach(function(item) {
          var currDay = item.stockData;
          var prevDay = allDays[item.index + 1];
          var fellDays = 0;
          while (currDay && prevDay && prevDay.close > currDay.close) {
            fellDays++;
            currDay = allDays[item.index + fellDays];
            prevDay = allDays[item.index + fellDays + 1];
          }
          if (fellDays >= minFellDays) {
            // console.log(count + ':Yes!' + stockCode, fellDays, item.date);
            targetStocks[stockCode] = targetStocks[stockCode] || [];
            targetStocks[stockCode].push({
              fellDays: fellDays,
              date: item.date,
              marks: 0
            });
          } else {
            // console.log(count + ':No!' + stockCode, fellDays);
          }
        });
      }
      finishOne();
    }, function(err) {
      done(err, {
        targetStocks: targetStocks
      });
    });
  }
};