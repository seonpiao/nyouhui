define(["libs/client/models/base"], function(Base) {
  var Model = Base.extend({
    exec: function(id, callback) {
      var url = '/task/run/' + id;
      $.ajax({
        url: url,
        error: function() {
          callback({
            message: '网络错误'
          });
        },
        success: function(data, xhr) {
          callback();
        }
      });
    }
  });
  return Model;
});