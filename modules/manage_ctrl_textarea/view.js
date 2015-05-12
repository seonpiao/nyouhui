define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_textarea",
    init: function() {
      autosize(this.$('textarea'));
    },
    value: function() {
      return this.$('textarea').val()
    },
    name: function() {
      return this.$('textarea').attr('name');
    }
  });
  return View;
});