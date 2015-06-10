define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_datepicker",
    init: function() {
      this.$('.input-group.date').datepicker({
        format: "yyyy-mm-dd",
        language: "zh-CN"
      });
    },
    value: function() {
      return this.$('input').val()
    },
    name: function() {
      return this.$('input').attr('name');
    }
  });
  return View;
});