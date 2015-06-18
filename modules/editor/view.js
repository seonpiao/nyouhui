define(["libs/client/views/base"], function(Base) {
  var id = 0;
  var View = Base.extend({
    moduleName: "editor",
    init: function() {
      id++;
      // this.$toolbar = this.$('.btn-toolbar');
      // this.$editable = this.$('.editable');
      // this.$toolbar.prop('id', 'editor_toolbar_' + id);
      // this.$editable.prop('id', 'editor_editable_' + id);
      // this.initToolbar(id);
      UM.getEditor(this.$el[0].id);
    },
    initToolbar: function(id) {
      var self = this;
      this.loadTemplate('toolbar', function(template) {
        var html = template();
        self.$toolbar.html(html);
        self.initData();
        self.$editable.wysiwyg({
          hotKeys: {},
          toolbarSelector: '#editor_toolbar_' + id
        });
      });
    },
    initData: function() {
      var self = this;
      var fonts = ['Serif', 'Sans', 'Arial', 'Arial Black', 'Courier',
          'Courier New', 'Comic Sans MS', 'Helvetica', 'Impact', 'Lucida Grande', 'Lucida Sans', 'Tahoma', 'Times',
          'Times New Roman', 'Verdana'
        ],
        fontTarget = this.$('[title=Font]').siblings('.dropdown-menu');
      $.each(fonts, function(idx, fontName) {
        fontTarget.append($('<li><a data-edit="fontName ' + fontName + '" style="font-family:\'' + fontName + '\'">' + fontName + '</a></li>'));
      });
      this.$('a[title]').tooltip({
        container: 'body'
      });
      this.$('.dropdown-menu input').click(function() {
          return false;
        })
        .change(function() {
          $(this).parent('.dropdown-menu').siblings('.dropdown-toggle').dropdown('toggle');
        });

      this.$('[data-role=magic-overlay]').each(function() {
        var overlay = $(this),
          target = self.$(overlay.data('target'));
        overlay.css('opacity', 0).css('position', 'absolute').offset(target.offset()).width(target.outerWidth()).height(target.outerHeight());
      });
    },
    value: function() {
      return this.$el.val();
    },
    name: function() {
      return this.$el.attr('data-name');
    }
  });
  return View;
});