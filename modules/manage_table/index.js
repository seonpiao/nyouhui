define(["modules/manage_table/view", "modules/manage_table/model"], function(View, Model) {
  return {
    init: function(el) {
      var view = new View({
        el: el,
        model: new Model()
      });
    }
  };
});