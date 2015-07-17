define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_adminprivilege",
    init: function() {
      this.model.db = this.$el.attr('data-db');
      this.model.collection = this.$el.attr('data-collection');
      this.listenTo(this.model, 'sync', this.render.bind(this));
      this.model.fetch();
    },
    render: function() {
      var self = this;
      var data = this.model.toJSON();
      var value = this.$el.attr('data-value');
      if (value) {
        value = JSON.parse(value);
      }
      this.loadTemplate('body', function(template) {
        var html = template({
          result: data,
          value: value
        });
        self.$('tbody').html(html);
      });
    },
    name: function() {
      return this.$el.attr('data-name');
    },
    value: function() {
      var $checkboxes = this.$('input[type=checkbox]');
      var privileges = {};
      $checkboxes.each(function(i, el) {
        var $el = $(el);
        var db = $el.attr('data-db');
        var collection = $el.attr('data-collection');
        var action = $el.attr('data-action');
        privileges[db] = privileges[db] || {};
        privileges[db][collection] = privileges[db][collection] || {};
        if (el.checked) {
          privileges[db][collection][action] = true;
        } else {
          privileges[db][collection][action] = false;
        }
      });
      return JSON.stringify(privileges);
    }
  });
  return View;
});