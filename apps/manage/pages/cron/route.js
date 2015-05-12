var fs = require('fs');
var path = require('path');
var logger = require('log4js').getLogger('cron');
var thunkify = require('thunkify');
var request = require('request');
var Mongo = require('../../../../libs/server/mongodb');

module.exports = function(app) {
  app.route('/cron').get(function*(next) {
    var taskNames = fs.readdirSync(path.join(__dirname, 'tasks'));
    var tasks = taskNames.map(function(fileName) {
      var taskid = path.basename(fileName, '.js');
      var task = require(path.join(__dirname, 'tasks', fileName))
      task.id = taskid;
      return task;
    });
    try {
      this.result = {
        code: 200,
        result: {
          data: tasks
        }
      }
      console.log(this.result)
    } catch (e) {
      this.result = {
        code: 500,
        message: e.message
      }
      logger.error(e.stack);
    }
  });
  app.route('/cron/create').get(function*(next) {
    var taskNames = fs.readdirSync(path.join(__dirname, 'tasks'));
    var tasks = taskNames.map(function(fileName) {
      var taskid = path.basename(fileName, '.js');
      var task = require(path.join(__dirname, 'tasks', fileName))
      task.id = taskid;
      return task;
    });
    this.result = {
      tasks: tasks
    };
    this.view = 'update';
  });
  app.route('/cron/update').get(function*(next) {
    var taskNames = fs.readdirSync(path.join(__dirname, 'tasks'));
    var tasks = taskNames.map(function(fileName) {
      var taskid = path.basename(fileName, '.js');
      var task = require(path.join(__dirname, 'tasks', fileName))
      task.id = taskid;
      return task;
    });
    console.log(tasks);
    this.result = {
      tasks: tasks
    };
  });
  app.route('/cron/run/:id').get(function*(next) {
    this.json = true;
    var task = require(path.join(__dirname, 'tasks', this.request.params.id + '.js'));
    try {
      yield task.run();
      this.result = {
        code: 200
      };
    } catch (e) {
      this.result = {
        code: 500
      };
      logger.error(e.stack);
    }
  });
}