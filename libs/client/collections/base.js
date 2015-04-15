define(function() {
  var Colletion = Backbone.Collection.extend({
    initialize: function() {
      this.init.apply(this, arguments);
    },
    init: function() {},
    cache: function(options, callback) {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }
      if (this.models.length > 0) {
        callback();
      } else {
        this.once('sync', function() {
          callback();
        });
        this.fetch(options);
      }
    },
    parse: function(res) {
      if (res && res.ret_code === 0) {
        return res.result;
      }
      if (res && res.ret_code != 0) {
        this.trigger('error', res);
        return [];
      }
      return [];
    }
  });
  return Colletion;
});