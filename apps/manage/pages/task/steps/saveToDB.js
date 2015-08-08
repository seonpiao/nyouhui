var Mongo = require('../../../../../libs/server/mongodb');
var pinyin = require('pinyin');
var co = require('co');

module.exports = {
  input: ['data', 'db', 'collection'],
  output: [],
  go: function(data, done) {
    var _data = data.data;
    co(function*() {
      var method = 'post';
      var _id;
      if (_data._id) {
        _id = _data._id;
        method = 'put';
        delete _data._id;
      }
      yield Mongo.request({
        db: data.db,
        collection: data.collection,
        id: _id,
        request: {
          method: method,
          json: _data
        }
      });
    })(function(err, data) {
      done();
    });
  }
};
