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
        var allIndex; // 当前日期在所有日期中的位置
        allDaysStockData.some(function(stockItem, index) {
          if (stockItem.date === item.date) {
            allIndex = index;
            return true;
          }
        });
        for (var i = allIndex; i < allIndex + targetAlldaysStockData[index].fellDays; i++) {
          //把连续下跌的换手率加起来，便于计算平均换手率
          turnrate += allDaysStockData[i].turnrate;
        }
        //平均换手率
        var avgTurnrate = turnrate / targetAlldaysStockData[index].fellDays;
        targetAlldaysStockData[index].marks = parseFloat(targetAlldaysStockData[index].marks);
        //根据换手率算评分，基础分10分，基础换手率10%
        targetAlldaysStockData[index].marks += (maxMarks * (avgTurnrate / 100));
        targetAlldaysStockData[index].marks = targetAlldaysStockData[index].marks.toFixed(2);
        targetStocks[stockCode][index] = targetAlldaysStockData[index];
      });
    }
    done(null, {
      targetStocks: targetStocks
    });
  }
};