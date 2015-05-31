var template = require('art-template');
var fs = require('fs');
var path = require('path');
var Mongo = require('../../../../libs/server/mongodb');
var thunkify = require('thunkify');

module.exports = function(app) {
  app.route('/install').get(function*(next) {
    this.result = {};
  }).post(function*(next) {
    this.raw = true;
    var body = this.request.body;
    //生成配置文件
    var manageTmpl = fs.readFileSync(path.join(__dirname, 'manage.tmpl')).toString();
    var manageFile = (template.compile(manageTmpl)(body));
    fs.writeFileSync(path.join(__dirname, '../../config2.js'), manageFile);
    if (fs.existsSync(path.join(__dirname, '../../../api/'))) {
      var apiTmpl = fs.readFileSync(path.join(__dirname, 'api.tmpl')).toString();
      var apiFile = (template.compile(apiTmpl)(body));
      fs.writeFileSync(path.join(__dirname, '../../../api/config2.js'), apiFile);
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
            required: 'yes'
          }, {
            name: 'base',
            alias: '基础控件',
            type: controlSelect._id.toString(),
            index: 'no',
            defaults: '',
            display: 'yes',
            required: 'node'
          }, {
            name: 'params',
            alias: '参数',
            type: input._id.toString(),
            index: 'no',
            defaults: '',
            display: 'yes',
            required: 'no'
          }, {
            name: 'desc',
            alias: '备注',
            type: input._id.toString(),
            index: 'no',
            defaults: '',
            display: 'yes',
            required: 'no'
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
            required: 'yes'
          }, {
            name: 'path',
            alias: '路径',
            type: input._id.toString(),
            index: 'no',
            defaults: '',
            display: 'yes',
            required: 'yes'
          }, {
            name: 'url',
            alias: 'url',
            type: input._id.toString(),
            index: 'no',
            defaults: '',
            display: 'yes',
            required: 'yes'
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
          password: 'admin'
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
            required: 'yes'
          }, {
            name: 'password',
            alias: '基础控件',
            type: password._id.toString(),
            index: 'no',
            defaults: '',
            display: 'yes',
            required: 'node'
          }]
        }
      });
      //======管理员======

    } catch (e) {
      console.log(e.stack);
      this.result = '安装失败';
      return;
    }

    this.result = '安装完成';
  });
}