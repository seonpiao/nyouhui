var crypto = require('crypto');

var sha1 = function(str) {
  var shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex');
};

module.exports = {
  input: ['data'],
  output: ['data'],
  go: function(data, done) {
    var _data = data.data;
    _data.password = sha1(_data.password);
    done();
  }
};
