define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_autocomplete",
    init: function() {
      this.model.db = this.$el.attr('data-db');
      this.model.collection = this.$el.attr('data-collection');
      var template = this.$el.attr('data-template') || '${name} - ${base}';
      var self = this;
      this.$('input').autocomplete({
        source: function(request, response) {
          $.getJSON("/api/" + self.model.db + '/' + self.model.collection, {
            query: JSON.stringify({
              name: {
                $regex: request.term
              }
            })
          }, function(json) {
            var list = json.result.data[json.result.db][json.result.collection].map(function(item) {
              var content = item.name;
              if (template) {
                content = template;
                var keys = template.match(/\$\{.*?\}/g);
                if (keys) {
                  _.each(keys, function(key) {
                    content = content.replace(key, item[key.match(/\$\{(.*)\}/)[1]]);
                  });
                }
              }
              return content;
            });
            response(list);
          });
        }
      });
    },
    value: function() {
      return this.$('input').val()
    },
    name: function() {
      return this.$('input').attr('name');
    }
  });
  return View;
});
