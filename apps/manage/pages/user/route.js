var fs = require('fs');
var path = require('path');

module.exports = function(app) {
  var route = app.route('/user');
  route.nested('/modifyPwd/:id?').get(function*() {
    this.result = {};
    this.view = 'modifyPwd';
  }).put(function*() {
    this.json = true;
    this.result = {
      code: 200
    }
  });
}
