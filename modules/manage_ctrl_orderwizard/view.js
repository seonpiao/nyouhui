define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_orderwizard",
    init: function() {
      this.$('.wizard').wizard({
        show: true
      });
    }
  });
  return View;
});