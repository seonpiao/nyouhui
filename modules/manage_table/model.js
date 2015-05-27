define(["libs/client/models/base"], function(Base) {
  var Model = Base.extend({
    exec: function(id) {
      var url = '/task/run/' + id;
      $.ajax({
        url: url,
        error: function() {
          alert('网络错误');
        },
        success: function(data, xhr) {
          if (data.code === 200) {
            alert('执行成功');
          } else {
            alert('执行失败:' + data.code);
          }
        }
      });
    }
  });
  return Model;
});