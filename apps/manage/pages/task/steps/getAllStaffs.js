var Mongo = require('../../../../../libs/server/mongodb');
var co = require('co');

module.exports = {
  input: [],
  output: ['staffs'],
  go: function(data, done) {
    var self = this;
    co(function*() {
      var staffs = yield Mongo.request({
        db: self.params.staff_db,
        collection: self.params.staff_collection
      });
      staffs = staffs[self.params.staff_db][self.params.staff_collection];
      return staffs;
    })(function(err, data) {
      done(null, {
        staffs: data
      });
    });
  }
};
