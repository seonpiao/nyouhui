define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_editor",
    init: function() {
      var um = UM.getEditor(this.$('textarea').attr('id'));
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