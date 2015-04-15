define(function() {
  window.Element && function(ElementPrototype) {
    ElementPrototype.matchesSelector = ElementPrototype.matchesSelector ||
      ElementPrototype.mozMatchesSelector ||
      ElementPrototype.msMatchesSelector ||
      ElementPrototype.oMatchesSelector ||
      ElementPrototype.webkitMatchesSelector;
  }(Element.prototype);
  var isIE = navigator.userAgent.match(/MSIE/);
  var DomWatcher = function(options) {
    options = options || {};
    this.$el = $(document);
    this.handlers = {
      add: {},
      remove: {}
    };
    this.watchingElems = [];
    var self = this;
    //IE
    if (isIE) {
      // if (true) {
      var originHtml = jQuery.fn.html;
      jQuery.fn.html = function(value) {
        if (value === undefined) {
          return originHtml.apply(this, arguments);
        }
        var oldElements = this.find('*');
        originHtml.apply(this, arguments);
        _.each(oldElements, function(element) {
          self.$el.trigger('DOMNodeRemoved', {
            target: element
          });
        });
        var newElements = this.find('*');
        _.each(newElements, function(element) {
          self.$el.trigger('DOMNodeInserted', {
            target: element
          });
        });
        return this;
      };

      var originEmpty = jQuery.fn.empty;
      jQuery.fn.empty = function() {
        var oldElements = this.find('*');
        originEmpty.apply(this, arguments);
        _.each(oldElements, function(element) {
          self.$el.trigger('DOMNodeRemoved', {
            target: element
          });
        });
        return this;
      };

      var originRemove = jQuery.fn.remove;
      jQuery.fn.remove = function(selector) {
        var oldElements = selector ? jQuery.filter(selector, this) : this;
        originRemove.apply(this, arguments);
        _.each(oldElements, function(element) {
          self.$el.trigger('DOMNodeRemoved', {
            target: element
          });
        });
        return this;
      };

      var fnNames = ['append', 'prepend', 'before', 'after'];
      _.forEach(fnNames, function(fnName) {
        var origin = jQuery.fn[fnName];
        jQuery.fn[fnName] = function() {
          var oldElements = this.find('*');
          _.each(oldElements, function(element) {
            var $element = $(element);
            if (!$element.attr('data-elem-added')) {
              $element.attr('data-elem-added', '1');
            }
          });
          origin.apply(this, arguments);
          var newElements = this.find(':not([data-elem-added])');
          _.each(newElements, function(element) {
            self.$el.trigger('DOMNodeInserted', {
              target: element
            });
          });
          return this;
        };
      });
    }
    this.$el.on('DOMNodeInserted', function(e, data) {
      data = data || {};
      var target = data.target || e.target;
      var handlers = self.handlers.add;
      for (var selector in handlers) {
        var callback = handlers[selector];
        var el = self._find(target, selector);
        if (el.length > 0) {
          callback(el);
        }
      }
    });
    this.$el.on('DOMNodeRemoved', function(e, data) {
      data = data || {};
      var target = data.target || e.target;
      var handlers = self.handlers.remove;
      for (var selector in handlers) {
        var callback = handlers[selector];
        var el = self._find(target, selector);
        if (el.length > 0) {
          callback(el);
        }
      }
    });
  };
  DomWatcher.prototype.exist = function(selector, callback) {
    var el = this.$el.find(selector);
    if (el.length > 0) {
      callback(el);
    }
    this.onadd(selector, callback);
  };
  DomWatcher.prototype.onadd = function(selector, callback) {
    var self = this;
    this.handlers.add[selector] = callback;
  };
  DomWatcher.prototype.onremove = function(selector, callback) {
    var self = this;
    this.handlers.remove[selector] = callback;
  };
  DomWatcher.prototype._find = function(inserted, selector) {
    var els = [];
    //只检查element元素
    if (inserted.nodeType === 1) {
      //先看子元素中是否包含满足条件的元素
      var el = $(inserted).find(selector);
      if (el.length > 0) {
        els = Array.prototype.slice.call(el, 0);
      }
      //再检查当前被插入的元素是否满足条件
      if (inserted.matchesSelector) {
        if (inserted.matchesSelector(selector)) {
          els.push(inserted);
        }
      } else {
        //针对低版本IE浏览器
        var $parent = $(inserted).parent();
        //删除的节点
        if ($parent.length === 0) {
          $parent = $('<div/>');
          $parent.append(inserted);
        }
        var matched = _.some($parent.find(selector), function(elem) {
          return elem === inserted;
        });
        if (matched) {
          els.push(inserted);
        }
      }
    }
    return $(els);
  };
  return DomWatcher;
});