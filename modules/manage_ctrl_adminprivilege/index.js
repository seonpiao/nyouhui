define(["modules/manage_ctrl_adminprivilege/view", "modules/manage_ctrl_adminprivilege/model"], function(View, Model) {
  return {
    init: function(el) {
      var view = new View({
        el: el,
        model: new Model
      });
    }
  };
});