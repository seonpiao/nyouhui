define(["modules/manage_form/view", "modules/manage_form/model"], function(View, Model) {
  return {
    init: function(el) {
      var view = new View({
        el: el,
        model: new Model()
      });
    }
  };
});