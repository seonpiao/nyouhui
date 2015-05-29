var task = function(app) {

  return function*(next) {
    if (!this.session.taskQueue) {
      this.session.taskQueue = {};
    }
    if (!this.session.runningTask) {
      this.session.runningTask = {};
    }
    // if (this.session.taskSocketConnectListener) {
    //   this.session.taskSocketConnectListener.destroy();
    // }
    // this.session.taskSocketConnectListener = global.io.on('connect', function() {
    //   Object.keys(runningTask).forEach(function(taskid) {
    //     var queueid = runningTask[taskid].queueid;
    //     var task = runningTask[taskid].task;
    //     global.io.emit('task start', {
    //       queueid: queueid,
    //       task: {
    //         name: task.name
    //       }
    //     });
    //   });
    // });
    var taskQueue = this.session.taskQueue;
    var runningTask = this.session.runningTask;

    yield next;
  }
}

module.exports = task;