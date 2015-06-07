var Mongo = require('../../../../libs/server/mongodb');
var crypto = require('crypto');
var padnum = require('padnum');
var moment = require('moment');
var logger = require('log4js').getLogger('api/user');
var extend = require('node.extend');
var captcha = require('../../util/captcha');

var sha1 = function(str) {
  var shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex')
}

module.exports = function(app) {

  var auth = require('../../util/auth')(app);
  var checkLogin = require('../../util/checkLogin')(app);
  var getUserById = require('../../util/getUserById')(app);
  var saveUser = require('../../util/saveUser')(app);

  var route = app.route('/sos');

  var callForHelp = function*(user) {

  };

  var recordHelp = function*(helpData) {
    helpData.create_time = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
  };

  route.nested('/helpme').post(function*() {
    this.json = true;
    var uid =
      yield checkLogin.call(this);
    if (!uid) return;
    var x = parseFloat(this.request.body.x);
    var y = parseFloat(this.request.body.y);
    if (!x || !y) {
      this.result = app.Errors.MISSING_PARAMS;
      return;
    }
    var user =
      yield getUserById.call(this, uid);
    if (user) {
      user.loc = {
        type: 'Point',
        coordinates: [x.toFixed(1) * 1, y.toFixed(1) * 1]
      };
      yield saveUser(user);
      yield recordHelp({
        uid: user.uid,
        loc: user.loc
      });
      yield callForHelp(user);
      this.result = {
        code: 0
      }
    } else {
      this.result = app.Errors.USER_NOT_EXIST
    }
  });
};