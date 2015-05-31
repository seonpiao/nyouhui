define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_select",
    init: function() {
      this.model.db = this.$el.attr('data-db');
      this.model.collection = this.$el.attr('data-collection');
      var url = this.$el.attr('data-url');
      this.listenTo(this.model, 'sync', this.initSelect.bind(this));
      if (url) {
        this.model.fetch({
          url: url
        });
      } else {
        this.model.fetch();
      }
      this.$select = this.$('select');
    },
    initSelect: function() {
      var self = this;
      var result = this.model.toJSON();
      var data = result.data;
      if (result.db && result.collection) {
        data = data[result.db][result.collection];
      }
      var list = data;
      this.loadTemplate('option', function(template) {
        var html = template({
          value: self.$select.attr('data-value'),
          list: list
        });
        self.$select.append(html);
      });
    },
    value: function() {
      return this.$select.val();
    },
    name: function() {
      return this.$select.attr('name');
    }
  });
  return View;
});