define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_tagsinput",
    init: function() {
      this.model.db = this.$el.attr('data-db');
      this.model.collection = this.$el.attr('data-collection');
      this.listenTo(this.model, 'sync', this.initInput.bind(this));
      this.model.fetch();
      this.idMaps = {};
      this.nameMaps = {};
    },
    initInput: function() {
      var self = this;
      var result = this.model.toJSON();
      var tags = result.data[result.db][result.collection];
      _.forEach(tags, function(tag) {
        self.idMaps[tag.id] = tag.name;
        self.nameMaps[tag.name] = tag.id;
      });
      var ids = this.$('input[role=input]').val().split(' ');
      var names = _.map(ids, function(id) {
        return self.idMaps[id];
      });
      this.$('input[role=input]').val(names.join(' '));
      this.$('input[role=input]').tagsInput({
        width: '100%',
        delimiter: ' ',
        autocomplete: {
          minLength: 0,
          autoFocus: true
        },
        autocomplete_url: _.map(tags, function(item) {
          self.nameMaps[item.name] = item.id;
          return item.name;
        })
      });
    },
    value: function() {
      var self = this;
      return _.map(this.$('input[role=input]').val().split(' '), function(name) {
        return self.nameMaps[name];
      });
    },
    name: function() {
      return this.$('input[role=input]').attr('name');
    }
  });
  return View;
});