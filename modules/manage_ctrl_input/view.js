define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_input",
    value: function() {
      return this.$('input').val()
    },
    name: function() {
      return this.$('input').attr('name');
    }
  });
  return View;
});