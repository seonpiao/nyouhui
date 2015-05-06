define([ "modules/manage_ctrl_select/view","modules/manage_ctrl_select/model" ], function(View,Model) {
  return {
    init: function(el) {
      var view = new View({
        el: el,
        model: new Model
      });
    }
  };
});