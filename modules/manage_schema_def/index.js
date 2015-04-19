define(["modules/manage_schema_def/view", "modules/manage_schema_def/model"], function(View, Model) {
  return {
    init: function(el) {
      var view = new View({
        el: el,
        model: new Model()
      });
    }
  };
});