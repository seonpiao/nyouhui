if (!Function.prototype.bind) {
  Function.prototype.bind = function(obj) {
    var fn = this;
    var args = [].slice.call(arguments, 1);
    return function() {
      return fn.apply(obj, args.concat([].slice.call(arguments)));
    };
  };
}

if (!Array.isArray) {
  Array.isArray = _.isArray.bind(_);
}

if (!Array.prototype.filter) {
  Array.prototype.filter = function(fn) {
    return _.filter(this, fn);
  };
}

if (!Array.prototype.map) {
  Array.prototype.map = function(fn) {
    return _.map(this, fn);
  };
}

if (!Array.prototype.some) {
  Array.prototype.some = function(fn) {
    return _.some(this, fn);
  };
}

if (!Array.prototype.every) {
  Array.prototype.every = function(fn) {
    return _.every(this, fn);
  };
}

if (!Array.prototype.forEach) {
  Array.prototype.forEach = function(fn) {
    return _.forEach(this, fn);
  };
}

if (!window.console) {
  window.console = {
    log: function() {},
    info: function() {},
    debug: function() {},
    error: function() {}
  };
}

if (!Object.keys) {
  Object.keys = function(obj) {
    var keys = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        keys.push(key);
      }
    }
    return keys;
  };
}

require(["oz", "underscore", "backbone", "jaderuntime"], function(io) {
  var trigger = jQuery.fn.trigger;
  jQuery.fn.trigger = function(type, data) {
    var globalEvents = ["login", "logout", "DOMNodeRemoved", "DOMNodeInserted"];
    if (this[0] === document) {
      if (_.indexOf(globalEvents, type) !== -1) {
        trigger.apply(this, arguments);
      }
    } else {
      trigger.apply(this, arguments);
    }
    return this;
  };
});