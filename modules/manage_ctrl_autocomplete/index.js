define(["modules/manage_ctrl_autocomplete/view", "modules/manage_ctrl_autocomplete/model"], function(View, Model) {
  return {
    init: function(el) {
      var view = new View({
        el: el,
        model: new Model
      });
    }
  };
});