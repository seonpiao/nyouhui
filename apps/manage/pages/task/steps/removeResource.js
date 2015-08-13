var Mongo = require('../../../../../libs/server/mongodb');
var co = require('co');
var path = require('path');
var exec = require('child_process').exec;
var thunkify = require('thunkify');

module.exports = {
  input: ['data'],
  output: [],
  go: function(data, done) {
    var self = this;
    var _data = data.data;
    console.log(global.apps.manage.config.resource.path, _data.path);
    var filePath = path.join(global.apps.manage.config.resource.path, _data.path);
    co(function*() {
      yield thunkify(exec)('rm -f ' + filePath);
    })(function(err, data) {
      done(err);
    });
  }
};
