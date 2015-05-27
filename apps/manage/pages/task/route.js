var fs = require('fs');
var path = require('path');
var logger = require('log4js').getLogger('cron');
var thunkify = require('thunkify');
var request = require('request');
var Mongo = require('../../../../libs/server/mongodb');
require('seajs');
var Flow = require('flow-js');
var co = require('co');
var moment = require('moment');

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
    var data =
      yield Mongo.request({
        host: app.config.restful.host,
        port: app.config.restful.port,
        db: app.config.task.db,
        collection: app.config.task.collection,
        id: this.request.params.id
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
        try {
          yield thunkify(function(done) {
            steps.forEach(function(step) {
              flow.addStep(step.id, step);
            });
            flow.on('end', function() {
              done();
            });
            flow.begin();
            steps.forEach(function(step) {
              flow.go(step.id);
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
        taskid: this.request.params.id,
        result: JSON.stringify(this.result)
      }
    })
  });
}