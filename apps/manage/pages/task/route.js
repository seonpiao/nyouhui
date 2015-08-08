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
var extend = require('node.extend');

var enqueue = function(task) {
  var username = task.username;
  var taskQueue = global.taskQueue[username];
  var runningTask = global.runningTask[username];
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

var dequeue = function(username) {
  var taskQueue = global.taskQueue[username];
  var runningTask = global.runningTask[username];
  var queueid = Object.keys(taskQueue).shift();
  if (queueid) {
    var queueItem = taskQueue[queueid];
    delete taskQueue[queueid];
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
    task.flow.on('error', function(e) {
      logger.error(e.data);
      global.io.emit('task error', {
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
  }
};

var exec = function(task, done) {
  var username = task.username;
  task.flow.on('end', function() {
    done(null, task.flow.__context.data);
  });
  task.flow.on('error', function(e) {
    done(e);
  });
  task.flow.begin(task.beginData);
  task.steps.forEach(function(step) {
    task.flow.go(step.id);
  });
};

module.exports = function(app) {

  global.manage.runTask = function*(options) {
    var taskid = options.taskid,
      beginData = options.beginData || {},
      username = options.username
    var start = Date.now();
    var data =
      yield Mongo.request({
        collection: app.config.mongo.collections.task,
        id: taskid
      });
    data = (data[app.config.mongo.defaultDB][app.config.mongo.collections.task]);
    if (data) {
      var ids = data.steps;
      var sync = data.sync === '1';
      var flow = new Flow();
      var steps = [];
      for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        var originStep =
          yield Mongo.request({
            collection: app.config.mongo.collections.step,
            id: id
          });
        originStep = originStep[app.config.mongo.defaultDB][app.config.mongo.collections.step];
        var step = require(path.join(__dirname, 'steps', originStep.stepid +
          '.js'));
        step.id = originStep.stepid;
        try {
          step.params = JSON.parse(originStep.params);
        } catch (e) {
          step.params = {};
        }
        steps.push(step);
      }
      if (steps.length > 0) {
        try {
          extend(beginData, JSON.parse(data.data));
        } catch (e) {}
        beginData.mongo = app.config.mongo;
        try {
          steps.forEach(function(step) {
            flow.addStep(step.id, step);
          });
          var task = {
            username: username,
            id: taskid,
            name: data.name,
            flow: flow,
            steps: steps,
            beginData: beginData
          };
          if (sync) {
            return yield thunkify(exec)(task);
          } else {
            enqueue.call(this, task);
            dequeue.call(this, username);
          }
        } catch (e) {
          logger.error(e.stack);
          throw {
            code: 500
          };
        }
      }
    }
    var end = Date.now();
    yield Mongo.request({
      collection: app.config.mongo.collections.tasklog,
      request: {
        method: 'post',
        json: true,
        body: {
          start: moment(start).format('YYYY年MM月DD日 HH:mm:ss.SSS'),
          end: moment(end).format('YYYY年MM月DD日 HH:mm:ss.SSS'),
          taskid: taskid,
          result: JSON.stringify(this.result)
        }
      }
    })
  };

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
  app.route('/task/runnings').get(function*() {
    var taskQueue = global.taskQueue[this.session.username];
    var runningTask = global.runningTask[this.session.username];
    runningTask = Object.keys(runningTask).map(function(taskid) {
      var queueid = runningTask[taskid].queueid;
      var task = runningTask[taskid].task;
      return {
        queueid: queueid,
        task: {
          name: task.name
        }
      };
    });
    this.json = true;
    this.result = {
      code: 200,
      result: runningTask
    }
  });
  app.route('/task/run/:id').get(function*(next) {
    this.json = true;
    var taskid = this.request.params.id;
    try {
      yield global.manage.runTask({
        taskid: taskid,
        username: this.session.username
      });
      this.result = {
        code: 200
      };
    } catch (e) {
      logger.error(e.stack);
      this.result = e;
    }
    if (!this.result) {
      this.result = {
        code: 404,
        message: 'no step'
      };
    }
  });
}
