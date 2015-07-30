var Mongo = require('../../../../libs/server/mongodb');
var crypto = require('crypto');
var padnum = require('padnum');
var moment = require('moment');
var logger = require('log4js').getLogger('api/user');
var extend = require('node.extend');
var captcha = require('../../util/captcha');
var thunkify = require('thunkify');
var FirstrePush = require('carrier-firstre-push');

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
  var save = require('../../util/save')(app);

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

  var route = app.route('/sos');

  var callForHelp = function*(user) {
    //通知附近10公里的救援者
    var distance = 10000;
    var aroundHelpers = yield Mongo.request({
      collection: app.config.mongo.collections.user,
      request: {
        qs: {
          query: JSON.stringify({
            loc: {
              $near: {
                $geometry: user.loc,
                $maxDistance: distance
              }
            },
            //仅通知pro用户
            level: {
              $in: ['0', '1', '2', '3', '4', '5']
            },
            pushid: {
              $exists: true
            },
            uid: {
              $ne: user.uid
            }
          }),
          fields: JSON.stringify({
            device: 1,
            pushid: 1,
            uid: 1
          })
        }
      }
    });
    aroundHelpers = aroundHelpers[app.config.mongo.defaultDB][app.config.mongo.collections.user];
    yield FirstrePush.pushToPro(aroundHelpers);
  };

  var recordHelp = function*(helpData) {
    helpData.create_time = Date.now();
    helpData.rescuer = [];
    helpData.status = 1; //status为1表示正在进行的呼救，2为已解除的呼救，3为已经完成的呼救
    var db = yield Mongo.get({
      hosts: app.config.mongo.hosts.split(','),
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
    var user =
      yield getUserById.call(this, uid);
    if (user) {
      if (user.help_id) {
        this.result = app.Errors.SOS_MORE_THEN_ONCE;
        return;
      }
      user.loc = {
        type: 'Point',
        coordinates: [x * 1, y * 1]
      };
      yield Mongo.exec({
        hosts: app.config.mongo.hosts.split(','),
        db: app.config.mongo.defaultDB,
        collection: 'sos'
      }, 'ensureIndex', {
        loc: "2dsphere"
      });
      var helpResult = yield recordHelp({
        me: uid,
        loc: user.loc
      });
      user.help_id = helpResult._id.toString();
      yield saveUser(user);
      yield callForHelp(user);
      this.result = {
        code: 0,
        result: {
          id: helpResult._id.toString()
        }
      }
    } else {
      this.result = app.Errors.USER_NOT_EXIST;
    }
  });

  route.nested('/cancel').post(function*() {
    this.json = true;
    var uid =
      yield checkLogin.call(this);
    if (!uid) return;
    var me = yield getUserById(uid);
    if (me) {
      var helpId = me.help_id;
      if (helpId) {
        var result =
          yield Mongo.request({
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
              var index = user.helping.indexOf(helpId);
              if (index !== -1) {
                user.helping.splice(index, 1);
                yield saveUser(user);
              }
            }
          }
          //清空救援人列表
          result.rescuer = [];
          yield save('sos', result);
        }
        me.help_id = '';
        yield saveUser(me);
      }
      this.result = {
        code: 0
      }
    } else {
      this.result = app.Errors.USER_NOT_EXIST;
    }
  });

  route.nested('/finish').post(function*() {
    this.json = true;
    var uid =
      yield checkLogin.call(this);
    if (!uid) return;
    var status = (this.request.body.status || 3) * 1;
    var helpId = this.request.body.help_id;
    var result =
      yield Mongo.request({
        collection: 'sos',
        id: helpId
      });
    result = result[app.config.mongo.defaultDB]['sos'];
    if (result) {
      //将救援状态置为完成
      result.status = status // 3为救助成功，4为救助失败，5为转移至医院;
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
        collection: 'sos',
        id: helpId,
        request: {
          method: 'put',
          json: result
        }
      });
      user = yield getUserById(result.me);
      user.help_id = '';
      yield saveUser(user);
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
          collection: 'sos',
          id: helpId
        });
      result = result[app.config.mongo.defaultDB]['sos'];
      if (result) {
        if (result.rescuer.indexOf(user.uid) !== -1) {
          this.result = app.Errors.SOS_IN_RESCUR;
          return;
        }
        if (result.me === uid) {
          this.result = app.Errors.SOS_CANNOT_HELP_SELF;
          return;
        }
        result.rescuer.push(user.uid);
        user.helping.push(helpId);
        delete result._id;
        yield Mongo.request({
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

  route.nested('/notcoming').post(function*() {
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
          collection: 'sos',
          id: helpId
        });
      result = result[app.config.mongo.defaultDB]['sos'];
      if (result) {
        var index = result.rescuer.indexOf(uid);
        if (index !== -1) {
          result.rescuer.splice(index, 1);
          delete result._id;
          yield Mongo.request({
            collection: 'sos',
            id: helpId,
            request: {
              method: 'put',
              json: result
            }
          });
        }
        index = user.helping.indexOf(helpId);
        if (index !== -1) {
          user.helping.splice(index, 1);
          yield saveUser(user);
        }
      }
      this.result = {
        code: 0
      }
    } else {
      this.result = app.Errors.USER_NOT_EXIST
    }
  });

  route.nested('/detail').get(function*(next) {
    this.json = true;
    var uid =
      yield checkLogin.call(this);
    if (!uid) return;
    var helpId = this.request.query.help_id;
    var helpData =
      yield Mongo.request({
        collection: 'sos',
        id: helpId
      });
    helpData = helpData[app.config.mongo.defaultDB]['sos'];
    var wounded = yield getUserById(helpData.me, {
      fields: userDataStruct
    });
    var allHelpers = yield Mongo.request({
      collection: app.config.mongo.collections.user,
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
    allHelpers = allHelpers[app.config.mongo.defaultDB][app.config.mongo.collections.user];
    this.result = {
      code: 0,
      result: {
        wounded: wounded,
        all: allHelpers
      }
    }
  });
  route.nested('/around').get(function*(next) {
    this.json = true;
    var distance = 1000;
    var allHelpers = [],
      aroundHelpers = [];
    var uid =
      yield checkLogin.call(this);
    if (!uid) return;
    var me = yield getUserById(uid, {
      fields: userDataStruct
    });
    if (me) {
      var helpData =
        yield Mongo.request({
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
          collection: app.config.mongo.collections.user,
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
        allHelpers = allHelpers[app.config.mongo.defaultDB][app.config.mongo.collections.user];
        aroundHelpers = yield Mongo.request({
          collection: app.config.mongo.collections.user,
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
        aroundHelpers = aroundHelpers[app.config.mongo.defaultDB][app.config.mongo.collections.user];
      }
      this.result = {
        code: 0,
        result: {
          wounded: me,
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
