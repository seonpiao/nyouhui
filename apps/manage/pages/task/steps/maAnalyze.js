var request = require('request');
var Gather = require('pagegather');
var async = require('async');
var Mongo = require('../../../../../libs/server/mongodb');
var co = require('co');
var moment = require('moment');

module.exports = {
  input: ['allStocks', 'allStockDatas', 'targetStocks', 'mongo'],
  output: ['targetStocks'],
  go: function(data, done) {
    var targetStocks = data.targetStocks;
    var allStockDatas = data.allStockDatas;
    var maxMarks = 10;
    for (var stockCode in targetStocks) {
      var turnrate = 0;
      var allDaysStockData = allStockDatas[stockCode];
      var targetAlldaysStockData = targetStocks[stockCode];
      var targetStockDataList = targetAlldaysStockData.map(function(item) {
        return allDaysStockData.filter(function(item2, index) {
          if (item2.date === item.date) {
            return true;
          }
        })[0];
      });
      targetStockDataList.forEach(function(item, index) {
        var marks = (item.ma30) / (item.ma30 + item.close) * maxMarks;
        console.log(stockCode, item.date, marks);
        targetAlldaysStockData[index].marks = parseFloat(targetAlldaysStockData[index].marks);
        //根据换手率算评分，基础分10分，基础换手率10%
        targetAlldaysStockData[index].marks += marks;
        targetAlldaysStockData[index].marks = targetAlldaysStockData[index].marks.toFixed(2);
        targetStocks[stockCode][index] = targetAlldaysStockData[index];
      });
    }
    console.log(targetStocks);
    done(null, {
      targetStocks: targetStocks
    });
  }
};