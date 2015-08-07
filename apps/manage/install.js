var config = require('../config');

var template = require('art-template');
var fs = require('fs');
var path = require('path');
var Mongo = require('../../libs/server/mongodb');
var thunkify = require('thunkify');
var crypto = require('crypto');
var co = require('co');

var sha1 = function(str) {
  var shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex')
}

var collections = config.mongo.collections;

var initData = {};
var db = config.mongo.defaultDB,
  collection;

initData[db] = {};

collection = config.mongo.collections.control;
initData[db][collection] = [{
  id: 'input',
  name: 'input',
  base: '',
  params: '',
  desc: ''
}, {
  id: 'password',
  name: 'password',
  base: 'input',
  params: '',
  desc: ''
}, {
  id: 'checkbox',
  name: 'checkbox',
  base: '',
  params: '',
  desc: ''
}, {
  id: 'select',
  name: 'select',
  base: '',
  params: '',
  desc: ''
}, {
  id: 'textarea',
  name: 'textarea',
  base: '',
  params: '',
  desc: ''
}, {
  id: 'editor',
  name: 'editor',
  base: '',
  params: '',
  desc: ''
}, {
  id: 'tagsinput',
  name: 'tagsinput',
  base: '',
  params: '',
  desc: ''
}, {
  id: 'autocomplete',
  name: 'autocomplete',
  base: '',
  params: '',
  desc: ''
}, {
  id: 'checkboxselect',
  name: 'checkboxselect',
  base: '',
  params: '',
  desc: ''
}, {
  id: 'datepicker',
  name: 'datepicker',
  base: '',
  params: '',
  desc: ''
}, {
  id: 'customsort',
  name: 'customsort',
  base: '',
  params: '',
  desc: ''
}, {
  id: 'draggableselector',
  name: 'draggableselector',
  base: '',
  params: '',
  desc: ''
}, {
  id: 'usergroup_draggableselector',
  name: 'usergroup_draggableselector',
  base: 'draggableselector',
  params: '{"db":"' + db + '","collection":"' + collections.usergroup + '"}',
  desc: ''
}, {
  id: 'fileuploader',
  name: 'fileuploader',
  base: '',
  params: '',
  desc: ''
}, {
  id: 'contentblock',
  name: 'contentblock',
  base: '',
  params: '',
  desc: ''
}, {
  id: 'adminprivilege',
  name: 'adminprivilege',
  base: '',
  params: '{"db":"' + db + '","collection":"' + collections.schema + '"}',
  desc: ''
}, {
  id: 'continue',
  name: 'continue',
  base: '',
  params: '',
  desc: ''
}, {
  id: 'control_select',
  name: 'control_select',
  base: 'select',
  params: '{"db":"' + config.mongo.defaultDB + '","collection":"' + collections.control + '","none":"无"}',
  desc: ''
}, {
  id: 'step_draggableselector',
  name: 'step_draggableselector',
  base: 'draggableselector',
  params: '{"db":"' + config.mongo.defaultDB + '","collection":"' + collections.step + '"}',
  desc: ''
}, {
  id: 'stepid_select',
  name: 'stepid_select',
  base: 'select',
  params: '{"url":"/task/steps"}',
  desc: ''
}];

collection = collections.schema;
initData[db][collection] = [{
  db: db,
  collection: collections.control,
  params: '',
  fields: [{
    name: 'name',
    alias: '控件名',
    type: 'input',
    index: 'yes',
    defaults: '',
    display: 'yes',
    editable: 'required'
  }, {
    name: 'base',
    alias: '基础控件',
    type: 'control_select',
    index: 'no',
    defaults: '',
    display: 'yes',
    editable: 'required'
  }, {
    name: 'params',
    alias: '参数',
    type: 'input',
    index: 'no',
    defaults: '',
    display: 'yes',
    editable: 'yes'
  }, {
    name: 'desc',
    alias: '备注',
    type: 'input',
    index: 'no',
    defaults: '',
    display: 'yes',
    editable: 'yes'
  }]
}, {
  db: db,
  collection: collections.menu,
  params: '',
  fields: [{
    name: 'name',
    alias: '菜单名',
    type: 'input',
    index: 'no',
    defaults: '',
    display: 'yes',
    editable: 'required'
  }, {
    name: 'path',
    alias: '路径',
    type: 'input',
    index: 'no',
    defaults: '',
    display: 'yes',
    editable: 'required'
  }, {
    name: 'url',
    alias: 'url',
    type: 'input',
    index: 'no',
    defaults: '',
    display: 'yes',
    editable: 'required'
  }]
}, {
  db: db,
  collection: collections.admin,
  params: '',
  fields: [{
    name: 'username',
    alias: '用户名',
    type: 'input',
    index: 'yes',
    defaults: '',
    display: 'yes',
    editable: 'required'
  }, {
    name: 'password',
    alias: '密码',
    type: 'password',
    index: 'no',
    defaults: '123456',
    display: 'yes',
    editable: 'onlynew'
  }, {
    name: 'privilege',
    alias: '权限',
    type: 'adminprivilege',
    index: 'no',
    defaults: '',
    display: 'no',
    editable: 'required'
  }]
}, {
  db: db,
  collection: collections.usergroup,
  params: '',
  fields: [{
    name: 'id',
    alias: 'id',
    type: 'input',
    index: 'yes',
    defaults: '',
    display: 'yes',
    editable: 'required'
  }, {
    name: 'name',
    alias: '名称',
    type: 'input',
    index: 'no',
    defaults: '',
    display: 'yes',
    editable: 'required'
  }]
}, {
  db: db,
  collection: collections.privilege,
  params: '',
  fields: [{
    name: 'db',
    alias: 'db',
    type: 'input',
    index: 'no',
    defaults: '',
    display: 'yes',
    editable: 'required'
  }, {
    name: 'collection',
    alias: 'collection',
    type: 'input',
    index: 'no',
    defaults: '',
    display: 'yes',
    editable: 'required'
  }, {
    name: 'read',
    alias: '读取',
    type: 'usergroup_draggableselector',
    index: 'no',
    defaults: '',
    display: 'yes',
    editable: 'required'
  }, {
    name: 'write',
    alias: '写入',
    type: 'usergroup_draggableselector',
    index: 'no',
    defaults: '',
    display: 'yes',
    editable: 'required'
  }]
}, {
  db: db,
  collection: collections.task,
  params: '',
  fields: [{
    name: 'name',
    alias: '名称',
    type: 'input',
    index: 'unique',
    defaults: '',
    display: 'yes',
    editable: 'required'
  }, {
    name: 'steps',
    alias: '步骤',
    type: 'step_draggableselector',
    index: 'no',
    defaults: '',
    display: 'yes',
    editable: 'required'
  }, {
    name: 'data',
    alias: '数据',
    type: 'input',
    index: 'no',
    defaults: '',
    display: 'yes',
    editable: 'yes'
  }]
}, {
  db: db,
  collection: collections.step,
  params: '',
  fields: [{
    name: 'stepid',
    alias: 'id',
    type: 'input',
    index: 'unique',
    defaults: '',
    display: 'yes',
    editable: 'required'
  }, {
    name: 'name',
    alias: '名称',
    type: 'input',
    index: 'no',
    defaults: '',
    display: 'yes',
    editable: 'required'
  }, {
    name: 'params',
    alias: '参数',
    type: 'input',
    index: 'no',
    defaults: '',
    display: 'yes',
    editable: 'yes'
  }]
}];

collection = config.mongo.collections.menu;
initData[db][collection] = [{
  name: 'Schema',
  path: '系统设置',
  url: '/schema'
}, {
  name: '控件管理',
  path: '系统设置',
  url: '/crud/' + db + '/' + collections.control
}, {
  name: '管理员管理',
  path: '系统设置',
  url: '/crud/' + db + '/' + collections.admin
}, {
  name: '用户组',
  path: '系统设置',
  url: '/crud/' + db + '/' + collections.usergroup
}, {
  name: '权限管理',
  path: '系统设置',
  url: '/crud/' + db + '/' + collections.privilege
}, {
  name: '菜单管理',
  path: '系统设置',
  url: '/crud/' + db + '/' + collections.menu
}, {
  name: '任务管理',
  path: '任务系统',
  url: '/crud/' + db + '/' + collections.task
}, {
  name: '步骤管理',
  path: '任务系统',
  url: '/crud/' + db + '/' + collections.step
}];

collection = config.mongo.collections.usergroup;
initData[db][collection] = [{
  id: 'all',
  name: '所有用户'
}];

collection = config.mongo.collections.usergroup;
initData[db][collection] = [{
  id: 'all',
  name: '所有用户'
}];

co(function*() {
  var installed = [];
  for (var db in initData) {
    for (var collection in initData[db]) {
      var result = yield Mongo.request({
        host: config.mongo.restHost,
        port: config.mongo.restPort,
        db: db,
        collection: collection
      });
      result = result[db][collection];
      if (result && result.length > 0) {
        delete initData[db][collection];
        installed.push(db + '/' + collection);
      }
    }
  }

  if (installed.length > 0) {
    console.log('以下数据库中已有数据，没有写入数据：');
    console.log(installed.join(','));
  }

  for (var db in initData) {
    for (var collection in initData[db]) {
      for (var i = 0; i < initData[db][collection].length; i++) {
        console.log('writing: ' + db + '/' + collection + ': ' + i);
        yield Mongo.request({
          host: config.mongo.restHost,
          port: config.mongo.restPort,
          db: db,
          collection: collection,
          request: {
            method: 'post',
            json: initData[db][collection][i]
          }
        });
      }
    }
  }

  console.log('安装完成');
})();
