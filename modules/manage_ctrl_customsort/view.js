define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_customsort",
    init: function() {
      this.model.db = $('input[name=db]').val();
      this.model.collection = $('input[name=collection]').val();
      var filter = JSON.parse($('input[name=filter]').val() || '{}');
      var display = $('input[name=display]').val() || 'name';
      this.model.display = display;
      this.$list = this.$('ul');
      this.$list.sortable().disableSelection();
      this.listenTo(this.model, 'sync', this.initSortable.bind(this));
      $('input[name="db"],input[name="collection"],input[name=filter],input[name=display]').on('input', this.changeDataSource.bind(this));
      if (this.model.db && this.model.collection) {
        this.model.fetch({
          data: {
            query: JSON.stringify(filter)
          }
        });
      }
    },
    changeDataSource: function() {
      var self = this;
      clearTimeout(this._fetchTimer);
      this._fetchTimer = setTimeout(function() {
        self.model.db = $('input[name=db]').val();
        self.model.collection = $('input[name=collection]').val();
        var filter = JSON.parse($('input[name=filter]').val() || '{}');
        var display = $('input[name=display]').val() || 'name';
        self.model.display = display
        if (self.model.db && self.model.collection) {
          self.model.fetch({
            data: {
              query: JSON.stringify(filter)
            }
          });
        }
      }, 1000);
    },
    initSortable: function() {
      var self = this;
      var result = this.model.toJSON();
      var data = result.data;
      if (result.db && result.collection) {
        data = data[result.db][result.collection];
      }
      var objs = {};
      var list = _.map(data || [], function(item) {
        _.extend(item, {
          id: (item.id || item._id)
        })
        return item;
      });
      this.loadTemplate('li', function(template) {
        var seqIDs = self.$list.attr('data-value') || '';
        if (seqIDs) {
          try {
            list.sort(function(a, b) {
              return seqIDs.indexOf((a.id || a._id)) - seqIDs.indexOf((b.id || b._id));
            });
          } catch (e) {}
        }
        var html = template({
          list: list,
          display: self.model.display
        });
        self.$list.html(html);
      });
    },
    value: function() {
      var ids = _.map(this.$list.find('li'), function(li) {
        return $(li).attr('data-id');
      });
      return ids;
    },
    name: function() {
      return this.$list.attr('data-name');
    }
  });
  return View;
});
