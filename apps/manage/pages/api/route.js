var request = require('request');
var thunkify = require('thunkify');
var logger = require('log4js').getLogger('manage:api');
var auth = require('../../auth');

module.exports = function(app) {
  app.route('/api/:db/:collection/:id?').get(function*(next) {
    this.json = true;
    var db = this.request.params.db;
    var collection = this.request.params.collection;
    var id = this.request.params.id;
    try {
      var result =
        yield thunkify(request)({
          url: 'http://localhost:3000/' + db + '/' + collection + (id ? '/' + id : ''),
          qs: this.request.query
        });
      var data = JSON.parse(result[1]);
      this.result = {
        code: 200,
        data: data
      }
    } catch (e) {
      this.result = {
        code: 500,
        message: e.message
      }
      logger.error(e.stack);
    }
  }).post(function*(next) {
    this.json = true;
    var db = this.request.params.db;
    var collection = this.request.params.collection;
    var id = this.request.params.id;
    try {
      var result =
        yield thunkify(request)({
          url: 'http://localhost:3000/' + db + '/' + collection,
          json: this.request.body,
          method: this.method,
          headers: this.headers
        });
      var data = result[1];
      this.result = {
        code: 200,
        data: data
      }
    } catch (e) {
      this.result = {
        code: 500,
        message: e.message
      }
      logger.error(e.stack);
    }
  }).put(function*(next) {
    this.json = true;
    var db = this.request.params.db;
    var collection = this.request.params.collection;
    var id = this.request.params.id;
    try {
      var result =
        yield thunkify(request)({
          url: 'http://localhost:3000/' + db + '/' + collection,
          json: this.request.body,
          method: this.method,
          headers: this.headers
        });
      var data = result[1];
      this.result = {
        code: 200,
        data: data
      }
    } catch (e) {
      this.result = {
        code: 500,
        message: e.message
      }
      logger.error(e.stack);
    }
  });
}