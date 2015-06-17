define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_editor",
    init: function() {
      // var um = UM.getEditor(this.$('textarea').attr('id'));
      // this.$('.editor').wysiwyg({
      //   hotKeys: {},
      //   toolbarSelector: '[data-target=' + this.$('.editor').attr('id') + ']'
      // });
    },
    value: function() {
      return this.module('editor').value();
    },
    name: function() {
      return this.module('editor').name();
    }
  });
  return View;
});