define(["modules/manage_ctrl_won2yuan/view", "modules/manage_ctrl_won2yuan/model"], function(View, Model) {
  return {
    init: function(el) {
      var view = new View({
        el: el,
        model: new Model
      });
    }
  };
});