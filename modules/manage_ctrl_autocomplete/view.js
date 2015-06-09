define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_autocomplete",
    init: function() {
      this.model.db = this.$el.attr('data-db');
      this.model.collection = this.$el.attr('data-collection');
      this.listenTo(this.model, 'sync', this.initInput.bind(this));
      this.model.fetch();
    },
    value: function() {
      return this.$('input').val()
    },
    name: function() {
      return this.$('input').attr('name');
    },
    initInput: function() {
      var self = this;
      var result = this.model.toJSON();
      var sources = result.data[result.db][result.collection];
      sources = sources.map(function(item) {
        return item.name;
      });
      sources = _.uniq(sources);
      this.$('input').autocomplete({
        source: sources
      });
    }
  });
  return View;
});