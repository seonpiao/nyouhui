define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_tagsinput",
    init: function() {
      this.model.db = this.$el.attr('data-db');
      this.model.collection = this.$el.attr('data-collection');
      this.listenTo(this.model, 'sync', this.initInput.bind(this));
      this.model.fetch();
      this.maps = {}
    },
    initInput: function() {
      var self = this;
      this.$('input[role=input]').tagsInput({
        width: '100%',
        delimiter: ' ',
        autocomplete: {
          minLength: 0,
          autoFocus: true
        },
        autocomplete_url: _.map(this.model.toJSON(), function(item) {
          self.maps[item.name] = item.id;
          return item.name;
        })
      });
    },
    value: function() {
      var self = this;
      return [this.$('input[role=input]').val().split(' '), _.map(this.$('input[role=input]').val().split(' '), function(name) {
        return self.maps[name];
      })];
    },
    name: function() {
      return [this.$('input[role=input]').attr('name'), this.$('input[role=input]').attr('name') + '_id'];
    }
  });
  return View;
});