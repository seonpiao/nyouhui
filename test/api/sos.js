var assert = require("assert");
var request = require('request');
var token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOiIxMDAwMDAwMDAwMDYiLCJpYXQiOjE0MzY1MjM4ODB9.dI6DY7lFZTrFiQ5YwvDpjN_Q89G8CO76Hf_FGQ3kBcs';
var apiBase = 'http://local.nyouhui.com:9003/';
var uid = '100000000006';

//是否呼救过
var hasHelp = function(uid, callback) {
  var url = apiBase + 'data/firstre/sos';
  request({
    url: url,
    qs: {
      query: JSON.stringify({
        me: uid
      })
    }
  }, function(err, res, body) {
    var data = JSON.parse(body);
    if (data.code === 0) {
      var db = data.result.data.firstre;
      callback(db && db.sos && db.sos.length === 1);
    } else {
      callback(false);
    }
  });
};

var helpme = function(callback) {
  var url = apiBase + 'sos/helpme';
  request({
    url: url,
    method: 'post',
    form: {
      token: token,
      x: 50,
      y: 50
    }
  }, function(err, res, body) {
    var data = JSON.parse(body);
    callback(err, data);
  });
}

describe('sos', function() {
  describe('helpme', function() {
    it('成功发起且只能发起一次呼救', function(done) {
      hasHelp(uid, function(has) {
        if (has) {
          helpme(function(err, data) {
            assert.equal(data.code, 6000);
            done();
          });
        } else {
          helpme(function(err, data) {
            assert.equal(data.code, 0);
            done();
          });
        }
      });
    });
  });
});