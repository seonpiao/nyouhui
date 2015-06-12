define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "beima_signup_form",
    events: {
      'focus input': 'highlightInput',
      'blur input': 'normalizeInput',
      'focus input[name="other_qualification"]': 'checkOther',
      'submit': 'submit'
    },
    init: function() {
      this.listenTo(this.model, 'sync', this.success.bind(this));
    },
    highlightInput: function(e) {
      var $target = $(e.currentTarget);
      $target.parent().addClass('focus');
    },
    normalizeInput: function(e) {
      var $target = $(e.currentTarget);
      $target.parent().removeClass('focus');
    },
    submit: function(e) {
      e.preventDefault();
      var self = this;
      _.each(['name', 'phone', 'email'], function(field) {
        self.model.set(field, self.$('input[name="' + field + '"]').val());
      });
      var $checked = self.$('input[name="qualification"]:checked');
      if ($checked.val() === 'other') {
        self.model.set('other_qualification', self.$('input[name="other_qualification"]').val());
      } else {
        self.model.set('qualification', $checked.val());
      }
      self.model.save();
    },
    success: function(model, resp) {
      if (this.model.error) {
        alert(this.model.error.message);
      } else {
        alert('报名成功');
      }
    },
    checkOther: function(e) {
      var $target = $(e.target);
      $target.prev()[0].checked = true;
    }
  });
  return View;
});