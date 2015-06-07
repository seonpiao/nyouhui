var request = require('request');
var thunkify = require('thunkify');

module.exports = function(app) {

  var route = app.route('/finance');

  route.nested('/won2yuan').get(function*(next) {
    this.json = true;
    var won = this.request.query.won;
    var url = 'http://opendata.baidu.com/api.php?ie=utf8&oe=utf8&query=' + encodeURIComponent(won + '韩元等于多少人民币') + '&resource_id=6017';
    var result =
      yield thunkify(request)({
        url: url
      });
    if (result) {
      this.result = JSON.parse(result[1]);
    }
  });
};