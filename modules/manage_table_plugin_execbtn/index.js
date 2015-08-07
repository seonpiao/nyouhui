define(["modules/manage_table_plugin_execbtn/view", "modules/manage_table_plugin_execbtn/model"], function(View, Model) {
  return {
    init: function(el) {
      var view = new View({
        el: el,
        model: new Model
      });
    }
  };
});
