define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_schema_def",
    events: {
      'click .btn-schema-add': 'add'
    },
    init: function() {
      this.model.on('sync', this.check.bind(this));
    },
    add: function(e) {
      e.preventDefault();
      var $name = this.$('[name="name"]');
      var $alias = this.$('[name="alias"]');
      var $fields = this.$('.field-item');
      var fields = [];
      $fields.each(function(i, field) {
        var $field = $(field);
        fields.push({
          name: $field.find('[name="field_name"]').val(),
          alias: $field.find('[name="field_alias"]').val(),
          type: $field.find('[name="field_type"]').val(),
          index: $field.find('[name="field_index"]').val(),
          default: $field.find('[name="field_default"]').val(),
        });
      });
      this.model.set({
        name: $name.val(),
        alias: $alias.val(),
        fields: fields
      });
      this.model.save();
    },
    check: function(model) {
      if (model.error) {
        alert(model.error.message);
      } else {
        alert('ok');
      }
    }
  });
  return View;
});