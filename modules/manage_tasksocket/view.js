define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_tasksocket",
    init: function() {
      var self = this;
      this._queue = [];
      this._showing = [];
      this._top = 60;
      this._margin = 10;
      this.$el.css({
        position: 'fixed',
        right: 10,
        width: 300,
        zIndex: 100
      });
      this.model.getRunnings(function(tasks) {
        _.forEach(tasks, function(task) {
          var $tip = self._buildTip(task);
          self._queue.push($tip);
          self.show();
        });
      });
      this.module('socket', function(module) {
        if (module) {
          var socket = module.socket();
          socket.on('task start', function(data) {
            var $tip = self._buildTip(data);
            self._queue.push($tip);
            self.show();
          });
          socket.on('task end', function(data) {
            var queueid = data.queueid;
            var task = data.task;
            var $tip = $('[data-task-queueid="' + queueid + '"]');
            $tip.removeClass('alert-info');
            $tip.addClass('alert-success');
            setTimeout(function() {
              self.close($tip);
            }, 2000)
          });
          socket.on('task error', function(data) {
            var queueid = data.queueid;
            var task = data.task;
            var $tip = $('[data-task-queueid="' + queueid + '"]');
            $tip.removeClass('alert-info');
            $tip.addClass('alert-error');
            setTimeout(function() {
              self.close($tip);
            }, 2000)
          });
        }
      });
    },
    _buildTip: function(data) {
      var self = this;
      var queueid = data.queueid;
      var task = data.task;
      var $tip = self.$el.clone(true);
      $tip.removeAttr('data-module');
      $tip.attr('data-task-queueid', queueid);
      $tip.removeClass('hide');
      $tip.find('p').html(task.name);
      $tip.find('button').on('click', function() {
        self.close($tip);
      });
      return $tip;
    },
    show: function() {
      var self = this;
      while (this._queue.length > 0) {
        var $tip = this._queue.shift();
        (function($tip) {
          this._showing.push($tip);
          $tip.appendTo(this.$body);
          $tip.css({
            top: this._top
          });
          this._top += ($tip.outerHeight() + this._margin);
        }.bind(this))($tip);
      }
    },
    close: function($tip) {
      var self = this;
      var queueid = $tip.attr('data-task-queueid');
      var index = -1;
      var isShowing = _.some(this._showing, function($item, i) {
        if ($item.attr('data-task-queueid') === queueid) {
          index = i;
          return true;
        }
      });
      if (isShowing) {
        var tipHeight = $tip.outerHeight();
        this._showing.splice(index, 1);
        $tip.remove();
        this._top -= (tipHeight + this._margin);
        var behinds = this._showing.slice(index);
        _.forEach(behinds, function($item) {
          $item.css({
            top: $item.offset().top - (tipHeight + self._margin)
          })
        });
      }
    }
  });
  return View;
});