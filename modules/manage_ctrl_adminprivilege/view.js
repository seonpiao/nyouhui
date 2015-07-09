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
      this.loadTemplate('body', function(template) {
        var html = template({
          result: data
        });
        self.$('tbody').html(html);
      });
    },
    name: function() {

    },
    value: function() {

    }
  });
  return View;
});