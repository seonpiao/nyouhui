var Mongo = require('../libs/server/mongodb');

var config = {
  mongo: {
    restHost: 'localhost',
    restPort: 3000,
    hosts: 'localhost',
    defaultDB: 'firstre',
    collections: {
      schema: 'schema',
      admin: 'admin',
      privilege: 'privilege',
      user: 'user',
      usergroup: 'usergroup',
      uid: 'uid',
      menu: 'menu',
      step: 'step',
      task: 'task',
      tasklog: 'tasklog',
      control: 'control',
      customsort: 'customsort'
    }
  },
  resource: {
    host: 'localhost',
    path: '/data/resource/',
    user: 'root'
  },
  upload: {
    host: 'static.test.bylh.tv',
    path: '/usr/share/nginx/html/',
    uploadDir: 'upload'
  },
  redis: {
    host: 'localhost',
    port: 6379
  },
  apps: {
    api: {
      port: 9002,
      upload: {
        host: 'static.test.bylh.tv',
        path: '/usr/share/nginx/html/',
        collection: 'resource'
      }
    },
    m: {
      name: '北京马拉松',
      port: 9004
    },
    manage: {
      name: '第一反应',
      port: 9001,
      socket: {
        port: 3002
      }
    }
  }
};

Mongo.init(config);

module.exports = config;
