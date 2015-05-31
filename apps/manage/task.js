var task = function(app) {

  global.taskQueue = {};
  global.runningTask = {};

  return function*(next) {
    if (!global.taskQueue[this.session.username]) {
      global.taskQueue[this.session.username] = {};
    }
    if (!global.runningTask[this.session.username]) {
      global.runningTask[this.session.username] = {};
    }
    yield next;
  }
}

module.exports = task;