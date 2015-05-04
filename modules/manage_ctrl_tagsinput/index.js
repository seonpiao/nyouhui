define(["modules/manage_ctrl_tagsinput/view", "modules/manage_ctrl_tagsinput/model"], function(View, Model) {
  return {
    init: function(el) {
      var view = new View({
        el: el,
        model: new Model
      });
    }
  };
});