module.exports = function(app) {

  var config = {
    name: '北京马拉松',
    port: '9004',
    mongo: {
      host: 'localhost',
      port: 3000,
      replset: 'localhost',
      defaultDB: 'firstre'
    },
    redis: {
      host: 'localhost',
      port: 6379
    },
    schema: {
      db: 'firstre',
      collection: 'schema'
    },
    admin: {
      db: 'firstre',
      collection: 'admin'
    },
    privilege: {
      db: 'firstre',
      collection: 'privilege'
    },
    user: {
      db: 'firstre',
      collection: 'user'
    },
    usergroup: {
      db: 'firstre',
      collection: 'usergroup'
    },
    uid: {
      db: 'firstre',
      collection: 'uid'
    },
    menu: {
      db: 'firstre',
      collection: 'menu'
    },
    step: {
      db: 'firstre',
      collection: 'step'
    },
    task: {
      db: 'firstre',
      collection: 'task'
    },
    tasklog: {
      db: 'firstre',
      collection: 'tasklog'
    },
    control: {
      db: 'firstre',
      collection: 'control'
    },
    db: {
      hosts: 'localhost'
    },
  }

  return config;
};