define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_form",
    events: {
      'click .btn-cancel': 'cancel',
      'submit': 'submit'
    },
    init: function() {
      var $el = this.$el;
      if ($el.attr('data-db') && $el.attr('data-collection')) {
        this.model.db = $el.attr('data-db');
        this.model.collection = $el.attr('data-collection');
      } else if ($el.attr('data-url')) {
        this.model.customUrl = $el.attr('data-url');
      }
      this.listenTo(this.model, 'sync', this.success.bind(this));
      this.listenTo(this.model, 'error', this.error.bind(this));
      this.$submit = this.$('[type=submit]');
      setTimeout(this.fillModel.bind(this), 0);
    },
    fillModel: function() {
      var $ctrls = this.$('[data-form-control]');
      var self = this;
      $ctrls.each(function(i, ctrl) {
        var $ctrl = $(ctrl);
        var key, value;
        var view = $ctrl.data('view');
        if (_.isArray(view.name())) {
          view.name().forEach(function(v, i) {
            key = view.name()[i];
            value = view.value()[i];
            if (_.isArray(value)) {
              value = value.map(function(v) {
                if (typeof v === 'string') {
                  return v.trim();
                } else {
                  return v;
                }
              });
            } else if (value && typeof(value) === 'string') {
              value = value.trim();
            }
            self.model.set(key, value);
          })
        } else {
          key = view.name();
          value = view.value();
          if (value && typeof(value) === 'string') {
            value = value.trim();
          }
          self.model.set(key, value);
        }
      });
    },
    submit: function(e) {
      e.preventDefault();
      if (!this.$submit.hasClass('disabled')) {
        this.fillModel();
        this.$submit.addClass('disabled');
        this.model.save();
      }
    },
    cancel: function(e) {
      history.back();
    },
    success: function(model, resp, options) {
      if (resp.code === 200) {
        alert('操作成功');
        location.href = document.referrer;
      } else {
        alert(resp.message || '操作失败');
      }
      this.$submit.removeClass('disabled');
    },
    error: function(model, resp, options) {
      alert('操作失败');
      this.$submit.removeClass('disabled');
    }
  });
  return View;
});