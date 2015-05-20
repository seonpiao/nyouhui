var fs = require('fs');
var path = require('path');
var logger = require('log4js').getLogger('cron');
var thunkify = require('thunkify');
var request = require('request');
var Mongo = require('../../../../libs/server/mongodb');
require('seajs');
var Flow = require('flow-js');
var co = require('co');

module.exports = function(app) {
  app.route('/task').get(function*(next) {
    this.json = true;
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
    } catch (e) {
      this.result = {
        code: 500,
        message: e.message
      }
      logger.error(e.stack);
    }
  });
  app.route('/task/run/:id').get(function*(next) {
    this.json = true;
    var flow = new Flow();
    var ids = ['fetch', 'fetch1'] || this.request.params.id;
    var tasks = [];
    ids.forEach(function(id) {
      var task = require(path.join(__dirname, 'tasks', id + '.js'));
      task.id = id;
      tasks.push(task);
    });
    try {
      yield thunkify(function(done) {
        tasks.forEach(function(task) {
          flow.addStep(task.id, task.step);
        });
        flow.on('end', function() {
          done();
        });
        flow.begin();
        tasks.forEach(function(task) {
          flow.go(task.id);
        });
      })();
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