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
  return shasum.digest('hex');
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
    helpData.create_time = Date.now();
    helpData.rescuer = [];
    helpData.status = 1; //status为1表示正在进行的呼救，2为已解除的呼救，3为已经完成的呼救
    var db = yield Mongo.get({
      hosts: app.config.mongo.replset.split(','),
      db: app.config.mongo.defaultDB
    });
    var collection = db.collection('sos');
    var inserted = yield thunkify(collection.insert.bind(collection))(
      helpData, {
        fullResult: true
      });
    return inserted.ops[0];
  };

  route.nested('/articles').get(function*() {
    var result = 1;
  });

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
    var count = yield Mongo.exec({
      hosts: app.config.mongo.replset.split(','),
      db: app.config.mongo.defaultDB,
      collection: 'sos'
    }, 'count', {
      me: uid,
      status: 1
    });
    if (count > 0) {
      this.result = app.Errors.SOS_MORE_THEN_ONCE;
      return;
    }
    var user =
      yield getUserById.call(this, uid);
    if (user) {
      user.loc = {
        type: 'Point',
        coordinates: [x.toFixed(1) * 1, y.toFixed(1) * 1]
      };
      yield Mongo.exec({
        hosts: app.config.mongo.replset.split(','),
        db: app.config.mongo.defaultDB,
        collection: 'sos'
      }, 'ensureIndex', {
        loc: "2dsphere"
      });
      var helpResult = yield recordHelp({
        me: uid,
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
    var uid =
      yield checkLogin.call(this);
    if (!uid) return;
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
      //将救援状态置为取消
      result.status = 2;
      //从救援人的救援列表中删除本次救援
      if (result.rescuer.length > 0) {
        for (var i = 0; i < result.rescuer.length; i++) {
          var rescuerId = result.rescuer[i];
          var user = yield getUserById(rescuerId);
          var index = user.helping.indexOf(result._id.toString());
          if (index !== -1) {
            user.helping.splice(index, 1);
            yield saveUser(user);
          }
        }
      }
      //清空救援人列表
      result.rescuer = [];
      delete result._id;
      yield Mongo.request({
        host: app.config.mongo.host,
        port: app.config.mongo.port,
        db: app.config.mongo.defaultDB,
        collection: 'sos',
        id: helpId,
        request: {
          method: 'put',
          json: result
        }
      });
    }
    this.result = {
      code: 0
    }
  });

  route.nested('/finish').post(function*() {
    this.json = true;
    var uid =
      yield checkLogin.call(this);
    if (!uid) return;
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
      //将救援状态置为完成
      result.status = 3;
      //从救援人的救援列表中删除本次救援
      if (result.rescuer.length > 0) {
        for (var i = 0; i < result.rescuer.length; i++) {
          var rescuerId = rescuer[i];
          var user = yield getUserById(rescuerId);
          var index = user.helping.indexOf(result._id.toString());
          if (index !== -1) {
            user.helping.splice(index, 1);
            yield saveUser(user);
          }
        }
      }
      //清空救援人列表
      result.rescuer = [];
      delete result._id;
      yield Mongo.request({
        host: app.config.mongo.host,
        port: app.config.mongo.port,
        db: app.config.mongo.defaultDB,
        collection: 'sos',
        id: helpId,
        request: {
          method: 'put',
          json: result
        }
      });
    }
    this.result = {
      code: 0
    }
  });
  route.nested('/coming').post(function*() {
    this.json = true;
    var uid =
      yield checkLogin.call(this);
    if (!uid) return;
    var user =
      yield getUserById.call(this, uid);
    if (user) {
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
        result.rescuer.push(user.uid);
        user.helping.push(helpId);
        delete result._id;
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: app.config.mongo.defaultDB,
          collection: 'sos',
          id: helpId,
          request: {
            method: 'put',
            json: result
          }
        });
        yield saveUser(user);
      }
      this.result = {
        code: 0
      }
    } else {
      this.result = app.Errors.USER_NOT_EXIST
    }
  });

  route.nested('/around').get(function*(next) {
    this.json = true;
    var distance = 1000;
    var allHelpers = [],
      aroundHelpers = [];
    var userDataStruct = {
      uid: 1,
      nickname: 1,
      phone: 1,
      level: 1,
      level_name: 1,
      avatar: 1,
      qualification: 1,
      loc: 1
    };
    var uid =
      yield checkLogin.call(this);
    if (!uid) return;
    var me = yield getUserById(uid);
    if (me) {
      var helpData =
        yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: app.config.mongo.defaultDB,
          collection: 'sos',
          one: true,
          request: {
            qs: {
              query: JSON.stringify({
                me: me.uid,
                status: 1
              })
            }
          }
        });
      helpData = helpData[app.config.mongo.defaultDB]['sos'];
      if (helpData) {
        allHelpers = yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: app.config.user.db,
          collection: app.config.user.collection,
          request: {
            qs: {
              query: JSON.stringify({
                uid: {
                  $in: helpData.rescuer
                }
              }),
              fields: JSON.stringify(userDataStruct)
            }
          }
        });
        allHelpers = allHelpers[app.config.user.db][app.config.user.collection];
        aroundHelpers = yield Mongo.request({
          host: app.config.mongo.host,
          port: app.config.mongo.port,
          db: app.config.user.db,
          collection: app.config.user.collection,
          request: {
            qs: {
              query: JSON.stringify({
                loc: {
                  $near: {
                    $geometry: me.loc,
                    $maxDistance: distance
                  }
                },
                uid: {
                  $in: helpData.rescuer
                }
              }),
              fields: JSON.stringify(userDataStruct)
            }
          }
        });
        aroundHelpers = aroundHelpers[app.config.user.db][app.config.user
          .collection
        ];
      }
      this.result = {
        code: 0,
        result: {
          around: aroundHelpers,
          all: allHelpers,
          distance: distance
        }
      }
    } else {
      this.result = app.Errors.USER_NOT_EXIST
    }
  });
};
