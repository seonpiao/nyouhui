define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_table",
    events: {
      'click .del-row': 'del',
      'click .exec-row': 'exec'
    },
    init: function() {
      this.$el.dataTable({
        "bPaginate": true,
        "bLengthChange": true,
        "bFilter": true,
        "bSort": true,
        "bInfo": true,
        "bAutoWidth": false
      });
    },
    del: function(e) {
      var confirm = window.confirm('确定要删除么？');
      if (confirm) {
        var $target = $(e.currentTarget);
        var id = $target.attr('data-id');
        var db = this.$el.attr('data-db');
        var collection = this.$el.attr('data-collection');
        this.model.set({
          _id: id
        });
        this.model.db = db;
        this.model.collection = collection;
        this.model.once('sync', this.success.bind(this));
        this.model.once('error', this.success.bind(this));
        this.model.destroy();
      }
    },
    exec: function(e) {
      var $target = $(e.currentTarget);
      var id = $target.attr('data-id');
      this.model.exec(id, function(err) {
        if (err) {
          alert(err.message);
        }
      });
    },
    success: function(model, resp, options) {
      if (resp.code === 200) {
        alert('操作成功');
        location.reload();
      } else {
        alert(resp.message || '操作失败');
      }
    },
    error: function(model, resp, options) {
      alert('操作失败');
    }
  });
  return View;
});