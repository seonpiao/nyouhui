var fs = require('fs');
var path = require('path');

module.exports = function(app) {
  var route = app.route('/user');
  route.nested('/modifyPwd/:id?').get(function*() {
    this.result = {};
    this.view = 'modifyPwd';
  }).put(function*() {
    console.log(this.request.params.id);
    console.log(this.request.body);
    this.json = true;
    this.result = {
      code: 200
    }
  });
}