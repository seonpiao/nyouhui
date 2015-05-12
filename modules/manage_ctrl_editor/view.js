define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_editor",
    init: function() {
      this.$('textarea').wysihtml5();
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