define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_contentblock",
    _id: 0,
    events: {
      'click .add-item': 'add',
      'click .del-item': 'del'
    },
    init: function() {
      this.$blocks = this.$('.blocks');
      this.$blocks.sortable({
        handle: '.move-item'
      });
      this.initView();
    },
    initView: function() {
      var self = this;
      var value = this.$blocks.attr('data-value');
      try {
        value = JSON.parse(value);
      } catch (e) {
        value = [null];
      }
      if (value.length === 0) {
        value.push(null);
      }
      this.loadTemplate('block', function(template) {
        _.each(value, function(block) {
          self._id++;
          try {
            block = JSON.parse(block);
          } catch (e) {}
          var html = template({
            block: block,
            id: 'contentblock_' + self._id
          });
          var $tmp = $(html);
          self.$blocks.append($tmp);
          // var um = UM.getEditor(.attr('id'));
          // $tmp.find('.editor').wysiwyg({
          //   hotKeys: {},
          //   toolbarSelector: '[data-target=contentblock_' + self._id + ']'
          // });
        });
        self.check();
      });
    },
    value: function() {
      var $titles = this.$('.block-title');
      var $editors = this.$('[data-module=editor]');
      return _.map($editors, function(editor, i) {
        return JSON.stringify({
          title: $titles[i].firstChild.value,
          value: $(editor).data('view').value()
        });
      });
    },
    name: function() {
      return this.$el.attr('data-name');
    },
    add: function(e) {
      e.preventDefault();
      var self = this;
      self._id++;
      this.loadTemplate('block', function(template) {
        var html = template({
          block: [null],
          id: 'contentblock_' + self._id
        });
        var $tmp = $(html);
        self.$blocks.append($tmp);
        // var um = UM.getEditor($tmp.find('textarea').attr('id'));
        // $tmp.find('.editor').wysiwyg({
        //   hotKeys: {},
        //   toolbarSelector: '[data-target=contentblock_' + self._id + ']'
        // });
        self.check();
      });
    },
    del: function(e) {
      var $el = $(e.currentTarget);
      $el.parent().parent().remove();
      this.check();
    },
    check: function() {
      var $items = this.$blocks.find('>li');
      if ($items.length > 1) {
        this.$('.del-item').removeAttr('disabled');
      } else {
        this.$('.del-item').attr('disabled', 'disabled');
      }
    }
  });
  return View;
});