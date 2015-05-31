define(["modules/manage_ctrl_draggableselector/view", "modules/manage_ctrl_draggableselector/model"], function(View, Model) {
  return {
    init: function(el) {
      var view = new View({
        el: el,
        model: new Model
      });
    }
  };
});