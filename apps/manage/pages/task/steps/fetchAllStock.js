var request = require('request');
var Gather = require('pagegather');

module.exports = {
  input: [],
  output: ['allStocks'],
  go: function(data, done) {
    var stocks = [];
    var gather = new Gather({
      settings: {
        url: 'http://quote.stockstar.com/stock/stock_index.htm',
        config: {
          shstocks: '#index_data_0 li span a[]',
          szstocks: '#index_data_2 li span a[]'
        }
      }
    });
    gather.fetch(function(err, fetchedData) {
      var shstocks = fetchedData.shstocks.map(function(stock) {
        return stock + '.ss';
      });
      stocks = stocks.concat(shstocks);
      var szstocks = fetchedData.szstocks.map(function(stock) {
        return stock + '.sz';
      });
      stocks = stocks.concat(szstocks);
      done(null, {
        allStocks: stocks
      });
    });
  }
};