define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_won2yuan",
    events: {
      'input input': 'exchange'
    },
    value: function() {
      return this.$('input').val()
    },
    name: function() {
      return this.$('input').attr('name');
    },
    exchange: function(e) {
      var $target = $(e.target);
      var url = 'http://api.nyouhui.com/finance/won2yuan?won=1200';
      $.ajax({
        url: url,
        dataType: 'jsonp',
        jsonpCallback: 'cb',
        success: function(data) {
          alert(data.status)
        }
      });
    }
  });
  return View;
});