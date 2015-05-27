define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_draggableselector",
    init: function() {
      this.model.db = this.$el.attr('data-db');
      this.model.collection = this.$el.attr('data-collection');
      var url = this.$el.attr('data-url');
      this.listenTo(this.model, 'sync', this.initSelect.bind(this));
      if (url) {
        this.model.fetch({
          url: url
        });
      } else {
        this.model.fetch();
      }
      this.$all = this.$('.all-task');
      this.$using = this.$('.using-task');
      this.$('ul').sortable({
        connectWith: "ul"
      }).disableSelection();
    },
    initSelect: function() {
      var self = this;
      var result = this.model.toJSON();
      var data = result.data;
      if (result.db && result.collection) {
        data = data[result.db][result.collection];
      }
      var objs = {};
      var list = _.map(data || [], function(item) {
        objs[(item.id || item._id)] = {
          id: (item.id || item._id),
          name: item.name
        };
        return objs[(item.id || item._id)];
      });
      var allIDs = _.map(list, function(item) {
        return (item.id || item._id);
      });
      this.loadTemplate('li', function(template) {
        var usingIDs = self.$using.attr('data-value') || '[]';
        try {
          usingIDs = JSON.parse(usingIDs);
        } catch (e) {
          usingIDs = [];
        }
        var mappedValue = [];
        _.forEach(usingIDs, function(id) {
          var orig = _.filter(list, function(item) {
            return (item.id || item._id) === id;
          });
          if (orig.length > 0) {
            mappedValue = mappedValue.concat(orig);
          }
        });
        var diffIDs = _.difference(allIDs, usingIDs);
        var diff = _.map(diffIDs, function(id) {
          return objs[id];
        });
        var html = template({
          list: diff
        });
        self.$all.append(html);
        var html = template({
          list: mappedValue
        });
        self.$using.append(html);
      });
    },
    value: function() {
      var ids = _.map(this.$using.find('li'), function(li) {
        return $(li).attr('data-id');
      });
      return ids;
    },
    name: function() {
      return this.$using.attr('data-name');
    }
  });
  return View;
});