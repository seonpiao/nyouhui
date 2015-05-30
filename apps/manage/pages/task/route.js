var fs = require('fs');
var path = require('path');
var logger = require('log4js').getLogger('task');
var thunkify = require('thunkify');
var request = require('request');
var Mongo = require('../../../../libs/server/mongodb');
require('seajs');
var Flow = require('flow-js');
var co = require('co');
var moment = require('moment');
var tokenGenerator = require('random-token');

var enqueue = function(task) {
  var taskQueue = this.session.taskQueue;
  var runningTask = this.session.runningTask;
  var queueid = tokenGenerator(16);
  if (!runningTask[task.id]) {
    taskQueue[queueid] = ({
      queueid: queueid,
      task: task
    });
  } else {
    queueid = runningTask[task.id].queueid
  }
  return queueid;
};

var dequeue = function() {
  var taskQueue = this.session.taskQueue;
  var runningTask = this.session.runningTask;
  var queueid = Object.keys(taskQueue).shift();
  var queueItem = taskQueue[queueid];
  var task = queueItem.task;
  runningTask[task.id] = queueItem;
  task.flow.on('end', function() {
    global.io.emit('task end', {
      queueid: queueid,
      task: {
        name: task.name
      }
    });
    delete runningTask[task.id];
    delete taskQueue[queueid];
  });
  task.flow.begin(task.beginData);
  task.steps.forEach(function(step) {
    task.flow.go(step.id);
  });
  global.io.emit('task start', {
    queueid: queueid,
    task: {
      name: task.name
    }
  });
};

module.exports = function(app) {
  app.route('/task/steps').get(function*(next) {
    this.json = true;
    var taskNames = fs.readdirSync(path.join(__dirname, 'steps'));
    var tasks = taskNames.map(function(fileName) {
      var stepid = path.basename(fileName, '.js');
      var step = require(path.join(__dirname, 'steps', fileName))
      step.id = stepid;
      return step;
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
    var start = Date.now();
    var taskid = this.request.params.id;
    var data =
      yield Mongo.request({
        host: app.config.restful.host,
        port: app.config.restful.port,
        db: app.config.task.db,
        collection: app.config.task.collection,
        id: taskid
      });
    data = (data[app.config.task.db][app.config.task.collection]);
    if (data) {
      var ids = data.steps;
      var flow = new Flow();
      var steps = [];
      for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        var originStep =
          yield Mongo.request({
            host: app.config.restful.host,
            port: app.config.restful.port,
            db: app.config.step.db,
            collection: app.config.step.collection,
            id: id
          });
        originStep = originStep[app.config.step.db][app.config.step.collection];
        var step = require(path.join(__dirname, 'steps', originStep.stepid + '.js'));
        step.id = originStep.stepid;
        steps.push(step);
      }
      if (steps.length > 0) {
        var beginData = {};
        try {
          beginData = JSON.parse(data.data);
        } catch (e) {}
        beginData.restful = app.config.restful;
        try {
          var self = this;
          yield thunkify(function(done) {
            steps.forEach(function(step) {
              flow.addStep(step.id, step);
            });
            flow.on('end', function() {
              done();
            });
            enqueue.call(self, {
              id: taskid,
              name: data.name,
              flow: flow,
              steps: steps,
              beginData: beginData
            });
            dequeue.call(self);
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
      }
    }
    if (!this.result) {
      this.result = {
        code: 404,
        message: 'no step'
      };
    }
    var end = Date.now();
    yield Mongo.request({
      host: app.config.restful.host,
      port: app.config.restful.port,
      db: app.config.tasklog.db,
      collection: app.config.tasklog.collection
    }, {
      method: 'post',
      json: true,
      body: {
        start: moment(start).format('YYYY年MM月DD日 HH:mm:ss.SSS'),
        end: moment(end).format('YYYY年MM月DD日 HH:mm:ss.SSS'),
        taskid: taskid,
        result: JSON.stringify(this.result)
      }
    })
  });
}