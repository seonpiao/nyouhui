define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_table_plugin_execbtn",
    events: {
      'click': 'exec'
    },
    exec: function(e) {
      var data = JSON.parse(this.$el.attr('data-dynatable-plugin-data'));
      var id = (data.id || data._id);
      this.model.exec(id, function(err) {
        if (err) {
          alert(err.message);
        }
      });
    }
  });
  return View;
});
