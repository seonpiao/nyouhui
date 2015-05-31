define(["libs/client/models/base"], function(Base) {
  var Model = Base.extend({
    getRunnings: function(callback) {
      var url = '/task/runnings/';
      $.ajax({
        url: url,
        error: function() {
          callback({
            message: '网络错误'
          });
        },
        success: function(data, xhr) {
          callback(data.result || []);
        }
      });
    }
  });
  return Model;
});