define(function() {
  var View = Backbone.View.extend({
    __base: 'http://static.nyouhui.com/dist/template/',
    _templates: {},
    // __base: '/jsdev/dist/template/modules/',
    loadTemplate: function(template, callback) {
      var templates = this._templates;
      if (arguments.length === 1) {
        callback = template;
        template = null;
      }
      template = template || this.template;
      var tmplKey = this.moduleName + '/' + template;
      if (templates[tmplKey]) {
        callback(templates[tmplKey]);
      } else {
        var tplUrl = this.__base + tmplKey + '.js?_' + (new Date()).getTime();
        if (window.tplMapping) {
          tplUrl = this.__base + window.tplMapping[tmplKey];
        }
        $.getScript(tplUrl, function() {
          var key = this.moduleName + '.' + template;
          if (jade.templates[key]) {
            tmplFunction = jade.templates[key];
            if (tmplFunction) {
              templates[tmplKey] = tmplFunction;
              delete jade.templates[key];
            }
          } else if (templates[tmplKey]) {
            tmplFunction = templates[tmplKey];
          }
          callback(tmplFunction || function() {});
        }.bind(this));
      }
    },
    setModel: function(model) {
      this.model = model;
    },
    setCollection: function(collection) {
      this.collection = collection;
    },
    setTemplate: function(name, template) {
      this.template = name;
      this._templates[this.moduleName + '/' + name] = template;
    },
    $: function() {
      return this.$el.find.apply(this.$el, arguments);
    },
    $doc: $(document),
    $docWidth: $(document).width(),
    $body: $(document.body),
    initialize: function() {
      this.$el.data('view', this);
      this.$el[0].__view = this;
      var self = this;
      View.views.push(this);
      self.init.apply(self, arguments);
      if (this.model) {
        this.model.on('change', this.__triggerChange.bind(this));
      }
      setTimeout(function() {
        self.$el.trigger({
          type: 'viewbind',
          view: self
        });
      });
    },
    init: function() {},
    render: function() {
      var self = this;
      this.buildHtml(function(html) {
        if (self.renderElem) {
          self.$(self.renderElem).html(html);
        } else {
          self.$el.html(html);
        }
        self.trigger('afterrender');
      }.bind(this));
      return this;
    },
    module: function(name, instanceName, callback) {
      var $module;
      if (_.isFunction(instanceName)) {
        callback = instanceName;
        $module = $('[data-module=' + name + ']');
      } else if (typeof instanceName === 'string') {
        $module = $('[data-module-' + name + '=' + instanceName + ']');
      }
      if ($module.length > 0) {
        var module = $module.data('view');
        if (module) {
          callback(module);
        } else {
          $module.one('viewbind', function() {
            callback($module.data('view'));
          });
        }
      } else {
        callback(null);
      }
    },
    renderTo: function(selector) {
      var self = this;
      this.buildHtml(function(html) {
        self.$el.find(selector).html(html);
        self.trigger('afterrender');
      }.bind(this));
    },
    append: function(view) {
      this.$el.append(view.render().$el);
    },
    padNum: function(num, len) {
      prefix = '0';
      num = num.toString();
      var padLen = Math.max(len - num.length, 0);
      for (var i = 0; i < padLen; i++) {
        num = prefix + num;
      }
      return num;
    },
    buildHtml: function(callback) {
      var dataSource = this.model || this.collection;
      var self = this;
      this.loadTemplate(function(template) {
        var renderData = {};
        if (dataSource) {
          var originData = dataSource.toJSON();
          renderData = originData;
        }
        // if (originData.__combined) {
        // } else {
        //   renderData[dataSource.action] = originData;
        // }
        callback(template(renderData));
      });
    },
    remove: function() {
      Backbone.View.prototype.remove.apply(this, arguments);
      this.trigger('remove');
      return this;
    },
    __triggerChange: function() {
      var changed = this.model.changed;
      var self = this;
      _.each(changed, function(val, key) {
        if (_.isFunction(self[key + 'Changed'])) {
          self[key + 'Changed'](key, val);
        }
      });
    }
  });

  View.views = [];

  return View;
});