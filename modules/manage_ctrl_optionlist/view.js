define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_optionlist",
    events: {
      'keyup input.option': 'addOption',
      'click .delete': 'removeOption'
    },
    init: function() {
      this.$input = this.$('input');
      this.$list = this.$('ul');
      this.$list.sortable().disableSelection();
    },
    addOption: function(e) {
      e.preventDefault();
      e.stopPropagation();
      var self = this;
      if (e.keyCode === 13) {
        this.loadTemplate('li', function(template) {
          var html = template({
            item: {
              name: self.$input.val()
            }
          });
          self.$list.append(html);
        });
      }
    },
    removeOption: function(e) {
      $(e.target).parent().remove();
    },
    name: function() {
      return this.$list.attr('data-name');
    },
    value: function() {
      return _.map(this.$list.find('li'), function(li) {
        return {
          name: $(li).find('.name').text(),
          show_count: $(li).find('input').val() || 0
        }
      });
    }
  });
  return View;
});
