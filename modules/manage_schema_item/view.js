define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_schema_item",
    template: 'item',
    events: {
      'click .add-item': 'add',
      'click .del-item': 'del'
    },
    init: function() {
      this.renderTo('.schema-list');
      this.on('afterrender', this.check.bind(this));
    },
    add: function() {
      var self = this;
      this.buildHtml(function(html) {
        self.$('.schema-list').append(html);
        self.check();
      });
    },
    del: function() {
      var $items = this.$('.schema-list .form-group');
      $items.last().remove();
      this.check();
    },
    check: function() {
      var $items = this.$('.schema-list .form-group');
      if ($items.length > 1) {
        this.$('.del-item').removeAttr('disabled');
      } else {
        this.$('.del-item').attr('disabled', 'disabled');
      }
    }
  });
  return View;
});