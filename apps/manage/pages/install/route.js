var template = require('art-template');
var fs = require('fs');
var path = require('path');
var Mongo = require('../../../../libs/server/mongodb');
var thunkify = require('thunkify');
var crypto = require('crypto');

var sha1 = function(str) {
  var shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex')
}

var dbs = ['schema', 'admin', 'privilege', 'user', 'usergroup', 'uid', 'menu', 'step', 'task', 'tasklog', 'control'];

module.exports = function(app) {
  app.route('/install').get(function*(next) {
    this.result = {
      dbs: dbs
    };
  }).post(function*(next) {
    this.raw = true;
    var body = this.request.body;
    var installed = [];
    // var configs =
    //   yield Mongo.request({
    //     host: body.mongo_host,
    //     port: body.mongo_port,
    //     db: 'carrier_db',
    //     collection: 'carrier_config'
    //   }, {
    //     qs: {
    //       name: body.name
    //     }
    //   });
    // configs = configs['carrier_db']['carrier_config'];
    // if (configs && configs.length > 0) {
    //   this.result = '配置[' + body.name + ']已存在';
    //   return;
    // }
    for (var i = 0; i < dbs.length; i++) {
      var db = dbs[i];
      var result =
        yield Mongo.request({
          host: body.mongo_host,
          port: body.mongo_port,
          db: body[db + '_db'],
          collection: body[db + '_collection']
        });
      result = result[body[db + '_db']][body[db + '_collection']];
      if (result && result.length > 0) {
        installed.push(db);
      }
    }

    //生成配置文件
    var manageTmpl = fs.readFileSync(path.join(__dirname, 'manage.tmpl')).toString();
    var manageFile = (template.compile(manageTmpl)(body));
    fs.writeFileSync(path.join(__dirname, '../../config.js'), manageFile);
    if (fs.existsSync(path.join(__dirname, '../../../api/'))) {
      var apiTmpl = fs.readFileSync(path.join(__dirname, 'api.tmpl')).toString();
      var apiFile = (template.compile(apiTmpl)(body));
      fs.writeFileSync(path.join(__dirname, '../../../api/config.js'), apiFile);
    }

    if (installed.length > 0) {
      this.result = '安装完成。但因为以下数据库中已有数据，因此仅更新了配置文件：';
      this.result += installed.join(',');
      return;
    }

    //初始化数据库
    try {

      yield Mongo.request({
        host: body.mongo_host,
        port: body.mongo_port,
        db: body.menu_db,
        collection: body.menu_collection
      }, {
        method: 'post',
        json: {
          name: 'Schema',
          path: '系统设置',
          url: '/schema'
        }
      });

      //======控件======
      //--菜单
      yield Mongo.request({
        host: body.mongo_host,
        port: body.mongo_port,
        db: body.menu_db,
        collection: body.menu_collection
      }, {
        method: 'post',
        json: {
          name: '控件管理',
          path: '系统设置',
          url: '/crud/' + body.control_db + '/' + body.control_collection
        }
      });
      //--初始数据
      yield Mongo.request({
        host: body.mongo_host,
        port: body.mongo_port,
        db: body.control_db,
        collection: body.control_collection
      }, {
        method: 'post',
        json: {
          name: 'input',
          base: '',
          params: '',
          desc: ''
        }
      });
      var input =
        yield Mongo.request({
          host: body.mongo_host,
          port: body.mongo_port,
          db: body.control_db,
          collection: body.control_collection,
          one: true
        }, {
          qs: {
            query: JSON.stringify({
              name: 'input'
            })
          }
        });
      input = input[body.control_db][body.control_collection];
      yield Mongo.request({
        host: body.mongo_host,
        port: body.mongo_port,
        db: body.control_db,
        collection: body.control_collection
      }, {
        method: 'post',
        json: {
          name: 'password',
          base: input._id.toString(),
          params: '{"type":"password"}',
          desc: ''
        }
      });
      var password =
        yield Mongo.request({
          host: body.mongo_host,
          port: body.mongo_port,
          db: body.control_db,
          collection: body.control_collection,
          one: true
        }, {
          qs: {
            query: JSON.stringify({
              name: 'password'
            })
          }
        });
      password = password[body.control_db][body.control_collection];
      yield Mongo.request({
        host: body.mongo_host,
        port: body.mongo_port,
        db: body.control_db,
        collection: body.control_collection
      }, {
        method: 'post',
        json: {
          name: 'select',
          base: '',
          params: '',
          desc: ''
        }
      });
      var select =
        yield Mongo.request({
          host: body.mongo_host,
          port: body.mongo_port,
          db: body.control_db,
          collection: body.control_collection,
          one: true
        }, {
          qs: {
            query: JSON.stringify({
              name: 'select'
            })
          }
        });
      select = select[body.control_db][body.control_collection];
      yield Mongo.request({
        host: body.mongo_host,
        port: body.mongo_port,
        db: body.control_db,
        collection: body.control_collection
      }, {
        method: 'post',
        json: {
          name: 'control_select',
          base: select._id.toString(),
          params: '{"db":"' + body.control_db + '","collection":"' + body.control_collection + '"}',
          desc: ''
        }
      });
      var controlSelect =
        yield Mongo.request({
          host: body.mongo_host,
          port: body.mongo_port,
          db: body.control_db,
          collection: body.control_collection,
          one: true
        }, {
          qs: {
            query: JSON.stringify({
              name: 'control_select'
            })
          }
        });
      controlSelect = controlSelect[body.control_db][body.control_collection];
      yield Mongo.request({
        host: body.mongo_host,
        port: body.mongo_port,
        db: body.control_db,
        collection: body.control_collection
      }, {
        method: 'post',
        json: {
          name: 'draggableselector',
          base: '',
          params: '',
          desc: ''
        }
      });
      var controlDraggableselector =
        yield Mongo.request({
          host: body.mongo_host,
          port: body.mongo_port,
          db: body.control_db,
          collection: body.control_collection,
          one: true
        }, {
          qs: {
            query: JSON.stringify({
              name: 'draggableselector'
            })
          }
        });
      controlDraggableselector = controlDraggableselector[body.control_db][body.control_collection];
      yield Mongo.request({
        host: body.mongo_host,
        port: body.mongo_port,
        db: body.control_db,
        collection: body.control_collection
      }, {
        method: 'post',
        json: {
          name: 'usergroup_draggableselector',
          base: 'draggableselector',
          params: '{"db":"' + body.usergroup_db + '","collection":"' + body.usergroup_collection + '"}',
          desc: ''
        }
      });
      var controlUsergroupDraggableselector =
        yield Mongo.request({
          host: body.mongo_host,
          port: body.mongo_port,
          db: body.control_db,
          collection: body.control_collection,
          one: true
        }, {
          qs: {
            query: JSON.stringify({
              name: 'usergroup_draggableselector'
            })
          }
        });
      controlUsergroupDraggableselector = controlUsergroupDraggableselector[body.control_db][body.control_collection];
      //--索引
      var dbconn =
        yield Mongo.get({
          db: body.control_db,
          hosts: body.mongo_replset.split(',')
        });
      var collection = dbconn.collection(body.control_collection);
      yield thunkify(collection.ensureIndex.bind(collection))({
        name: 1
      }, {
        unique: true
      });
      //--schema定义
      yield Mongo.request({
        host: body.mongo_host,
        port: body.mongo_port,
        db: body.schema_db,
        collection: body.schema_collection
      }, {
        method: 'post',
        json: {
          db: body.control_db,
          collection: body.control_collection,
          params: '',
          fields: [{
            name: 'name',
            alias: '控件名',
            type: input._id.toString(),
            index: 'yes',
            defaults: '',
            display: 'yes',
            editable: 'required'
          }, {
            name: 'base',
            alias: '基础控件',
            type: controlSelect._id.toString(),
            index: 'no',
            defaults: '',
            display: 'yes',
            editable: 'required'
          }, {
            name: 'params',
            alias: '参数',
            type: input._id.toString(),
            index: 'no',
            defaults: '',
            display: 'yes',
            editable: 'yes'
          }, {
            name: 'desc',
            alias: '备注',
            type: input._id.toString(),
            index: 'no',
            defaults: '',
            display: 'yes',
            editable: 'yes'
          }]
        }
      });
      //======控件======

      //======菜单======
      //--菜单
      yield Mongo.request({
        host: body.mongo_host,
        port: body.mongo_port,
        db: body.menu_db,
        collection: body.menu_collection
      }, {
        method: 'post',
        json: {
          name: '菜单管理',
          path: '高级设置',
          url: '/crud/' + body.menu_db + '/' + body.menu_collection
        }
      });
      //--schema定义
      yield Mongo.request({
        host: body.mongo_host,
        port: body.mongo_port,
        db: body.schema_db,
        collection: body.schema_collection
      }, {
        method: 'post',
        json: {
          db: body.menu_db,
          collection: body.menu_collection,
          params: '',
          fields: [{
            name: 'name',
            alias: '菜单名',
            type: input._id.toString(),
            index: 'no',
            defaults: '',
            display: 'yes',
            editable: 'required'
          }, {
            name: 'path',
            alias: '路径',
            type: input._id.toString(),
            index: 'no',
            defaults: '',
            display: 'yes',
            editable: 'required'
          }, {
            name: 'url',
            alias: 'url',
            type: input._id.toString(),
            index: 'no',
            defaults: '',
            display: 'yes',
            editable: 'required'
          }]
        }
      });
      //======菜单======

      //======管理员======
      //--菜单
      yield Mongo.request({
        host: body.mongo_host,
        port: body.mongo_port,
        db: body.menu_db,
        collection: body.menu_collection
      }, {
        method: 'post',
        json: {
          name: '管理员管理',
          path: '系统设置',
          url: '/crud/' + body.admin_db + '/' + body.admin_collection
        }
      });
      //--初始数据
      yield Mongo.request({
        host: body.mongo_host,
        port: body.mongo_port,
        db: body.admin_db,
        collection: body.admin_collection
      }, {
        method: 'post',
        json: {
          username: 'root',
          password: sha1('admin')
        }
      });
      //--索引
      var dbconn =
        yield Mongo.get({
          db: body.admin_db,
          hosts: body.mongo_replset.split(',')
        });
      var collection = dbconn.collection(body.admin_collection);
      yield thunkify(collection.ensureIndex.bind(collection))({
        username: 1
      }, {
        unique: true
      });
      //--schema定义
      yield Mongo.request({
        host: body.mongo_host,
        port: body.mongo_port,
        db: body.schema_db,
        collection: body.schema_collection
      }, {
        method: 'post',
        json: {
          db: body.admin_db,
          collection: body.admin_collection,
          params: '',
          fields: [{
            name: 'username',
            alias: '用户名',
            type: input._id.toString(),
            index: 'yes',
            defaults: '',
            display: 'yes',
            editable: 'required'
          }, {
            name: 'password',
            alias: '密码',
            type: password._id.toString(),
            index: 'no',
            defaults: '123456',
            display: 'yes',
            editable: 'required'
          }]
        }
      });
      //======管理员======

      //======用户组======
      //--菜单
      yield Mongo.request({
        host: body.mongo_host,
        port: body.mongo_port,
        db: body.menu_db,
        collection: body.menu_collection
      }, {
        method: 'post',
        json: {
          name: '用户组管理',
          path: '系统设置',
          url: '/crud/' + body.usergroup_db + '/' + body.usergroup_collection
        }
      });
      //--初始数据
      yield Mongo.request({
        host: body.mongo_host,
        port: body.mongo_port,
        db: body.usergroup_db,
        collection: body.usergroup_collection
      }, {
        method: 'post',
        json: {
          id: 'all',
          name: '所有用户'
        }
      });
      //--索引
      var dbconn =
        yield Mongo.get({
          db: body.usergroup_db,
          hosts: body.mongo_replset.split(',')
        });
      var collection = dbconn.collection(body.usergroup_collection);
      yield thunkify(collection.ensureIndex.bind(collection))({
        name: 1
      }, {
        unique: true
      });
      //--schema定义
      yield Mongo.request({
        host: body.mongo_host,
        port: body.mongo_port,
        db: body.schema_db,
        collection: body.schema_collection
      }, {
        method: 'post',
        json: {
          db: body.usergroup_db,
          collection: body.usergroup_collection,
          params: '',
          fields: [{
            name: 'id',
            alias: 'id',
            type: input._id.toString(),
            index: 'yes',
            defaults: '',
            display: 'yes',
            editable: 'required'
          }, {
            name: 'name',
            alias: '名称',
            type: input._id.toString(),
            index: 'no',
            defaults: '',
            display: 'yes',
            editable: 'required'
          }]
        }
      });
      //======用户组======

      //======权限管理======
      //--菜单
      yield Mongo.request({
        host: body.mongo_host,
        port: body.mongo_port,
        db: body.menu_db,
        collection: body.menu_collection
      }, {
        method: 'post',
        json: {
          name: '权限管理',
          path: '系统设置',
          url: '/crud/' + body.privilege_db + '/' + body.privilege_collection
        }
      });
      //--初始数据
      //--索引
      var dbconn =
        yield Mongo.get({
          db: body.privilege_db,
          hosts: body.mongo_replset.split(',')
        });
      var collection = dbconn.collection(body.privilege_collection);
      yield thunkify(collection.ensureIndex.bind(collection))({
        db: 1,
        collection: 1
      });
      //--schema定义
      yield Mongo.request({
        host: body.mongo_host,
        port: body.mongo_port,
        db: body.schema_db,
        collection: body.schema_collection
      }, {
        method: 'post',
        json: {
          db: body.privilege_db,
          collection: body.privilege_collection,
          params: '',
          fields: [{
            name: 'db',
            alias: 'db',
            type: input._id.toString(),
            index: 'no',
            defaults: '',
            display: 'yes',
            editable: 'required'
          }, {
            name: 'collection',
            alias: 'collection',
            type: input._id.toString(),
            index: 'no',
            defaults: '',
            display: 'yes',
            editable: 'required'
          }, {
            name: 'read',
            alias: '读取',
            type: controlUsergroupDraggableselector._id.toString(),
            index: 'no',
            defaults: '',
            display: 'yes',
            editable: 'required'
          }, {
            name: 'write',
            alias: '写入',
            type: controlUsergroupDraggableselector._id.toString(),
            index: 'no',
            defaults: '',
            display: 'yes',
            editable: 'required'
          }]
        }
      });
      //======权限管理======

    } catch (e) {
      console.log(e.stack);
      this.result = '安装失败';
      return;
    }

    this.result = '安装完成';
  });
}