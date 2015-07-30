define(["modules/manage_ctrl_customsort/view", "modules/manage_ctrl_customsort/model"], function(View, Model) {
  return {
    init: function(el) {
      var view = new View({
        el: el,
        model: new Model
      });
    }
  };
});
