define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_checkbox",
    init: function() {
      this.model.db = this.$el.attr('data-db');
      this.model.collection = this.$el.attr('data-collection');
      this.listenTo(this.model, 'sync', this.initCheckbox.bind(this));
      this.model.fetch();
      this.$checkboxPanel = this.$('.checkbox-panel');
    },
    initCheckbox: function() {
      var self = this;
      var result = this.model.toJSON();
      var list = result.data[result.db][result.collection];
      var value = self.$el.attr('data-value');
      if (value) {
        try {
          value = JSON.parse(self.$el.attr('data-value'));
        } catch (e) {
          value = [value];
        }
      } else {
        value = [];
      }
      this.loadTemplate('checkbox', function(template) {
        var html = template({
          value: value,
          name: self.$el.attr('data-name'),
          list: list
        });
        self.$checkboxPanel.html(html);
      });
    },
    value: function() {
      return _.map(this.$('input:checked'), function(input) {
        return $(input).val();
      });
    },
    name: function() {
      return this.$el.attr('data-name');
    }
  });
  return View;
});