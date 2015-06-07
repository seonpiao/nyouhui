define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_won2yuan",
    events: {
      'input input': 'exchange'
    },
    init: function() {
      this.$won = this.$('input[name="won"]');
      this.$yuan = this.$('.yuan');
      this.$stock = this.$('input[name="stock"]');
    },
    value: function() {
      var won = this.$won.val() * 1;
      var stock = this.$stock.val() * 1;
      var yuan = this.$yuan.html() * 1;
      var rate = yuan / stock / (won);
      return [won, yuan, rate, stock];
    },
    name: function() {
      return ['won', 'yuan', 'rate', 'stock'];
    },
    exchange: function(e) {
      var self = this;
      var url = 'http://api.nyouhui.com/finance/won2yuan?won=' + this.$won.val();
      $.ajax({
        url: url,
        success: function(data) {
          self.$('.yuan').html(data.data[0].number2 * self.$stock.val());
        }
      });
    }
  });
  return View;
});