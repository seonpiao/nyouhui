var Mongo = require('../../../../libs/server/mongodb');
var crypto = require('crypto');
var padnum = require('padnum');
var moment = require('moment');
var logger = require('log4js').getLogger('api/user');
var extend = require('node.extend');
var captcha = require('../../util/captcha');
var thunkify = require('thunkify');

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
    helpData.status = 1; //status为1表示正在进行的呼救，2为已解除的呼救，3为已经完成的呼救
    var db = yield Mongo.get({
      hosts: app.config.mongo.replset.split(','),
      db: app.config.mongo.defaultDB
    });
    var collection = db.collection('sos');
    var inserted = yield thunkify(collection.insert.bind(collection))(helpData, {
      fullResult: true
    });
    return inserted.ops[0];
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
      var helpResult = yield recordHelp({
        uid: user.uid,
        loc: user.loc
      });
      yield saveUser(user);
      yield callForHelp(user);
      this.result = {
        code: 0,
        result: {
          id: helpResult._id.toString()
        }
      }
    } else {
      this.result = app.Errors.USER_NOT_EXIST
    }
  });

  route.nested('/cancel').post(function*() {
    this.json = true;
    var helpId = this.request.body.help_id;
    var result =
      yield Mongo.request({
        host: app.config.mongo.host,
        port: app.config.mongo.port,
        db: app.config.mongo.defaultDB,
        collection: 'sos',
        id: helpId
      });
    result = result[app.config.mongo.defaultDB]['sos'];
    if (result) {
      result.status = 2;
      delete result._id;
      yield Mongo.request({
        host: app.config.mongo.host,
        port: app.config.mongo.port,
        db: app.config.mongo.defaultDB,
        collection: 'sos',
        id: helpId
      }, {
        method: 'put',
        json: result
      });
    }
    this.result = {
      code: 0
    }
  });

  route.nested('/finish').post(function*() {
    this.json = true;
    var helpId = this.request.body.help_id;
    var result =
      yield Mongo.request({
        host: app.config.mongo.host,
        port: app.config.mongo.port,
        db: app.config.mongo.defaultDB,
        collection: 'sos',
        id: helpId
      });
    result = result[app.config.mongo.defaultDB]['sos'];
    if (result) {
      result.status = 3;
      delete result._id;
      yield Mongo.request({
        host: app.config.mongo.host,
        port: app.config.mongo.port,
        db: app.config.mongo.defaultDB,
        collection: 'sos',
        id: helpId
      }, {
        method: 'put',
        json: result
      });
    }
    this.result = {
      code: 0
    }
  });
};