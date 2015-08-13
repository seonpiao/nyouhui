var Mongo = require('../../../../../libs/server/mongodb');
var co = require('co');
var path = require('path');
var exec = require('child_process').exec;
var thunkify = require('thunkify');
var shellize = require('carrier-shellize');

module.exports = {
  input: ['data'],
  output: [],
  go: function(data, done) {
    var self = this;
    var resourceId = data.data;
    co(function*() {
      var resourceData = yield Mongo.request({
        collection: global.apps.manage.config.resource.collection,
        id: resourceId
      });
      resourceData = resourceData[global.apps.manage.config.mongo.defaultDB][global.apps.manage.config.resource.collection];
      var filePath = shellize(path.join(global.apps.manage.config.resource.path, resourceData.path));
      yield thunkify(exec)('rm -f ' + filePath);
    })(function(err, data) {
      done(err);
    });
  }
};
