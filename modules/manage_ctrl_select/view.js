define([ "libs/client/views/base" ], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_select",
    init:function(){
      this.model.db = this.$el.attr('data-db');
      this.model.collection = this.$el.attr('data-collection');
      this.listenTo(this.model, 'sync', this.initSelect.bind(this));
      this.model.fetch();
      this.idMaps = {};
      this.nameMaps = {};
      this.$select = this.$('select');
    },
    initSelect:function(){
      var self = this;
      var result = this.model.toJSON();
      var list = result.data[result.db][result.collection];
      _.forEach(list, function(item) {
        self.idMaps[item.id] = item.name;
        self.nameMaps[item.name] = item.id;
      });
      this.loadTemplate('option',function(template){
        var html = template({
          value:self.$select.attr('data-value'),
          list:list
        });
        self.$select.append(html);
      });
    },
    value: function() {
      return this.$select.val();
    },
    name: function() {
      return this.$select.attr('name');
    }
  });
  return View;
});