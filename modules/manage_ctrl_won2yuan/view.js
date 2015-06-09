define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_won2yuan",
    events: {
      'input input': 'exchange'
    },
    init: function() {
      this.$won = this.$('input[name="won"]');
      this.$discount = this.$('input[name="discount"]');
      this.$stock = this.$('input[name="stock"]');
      this.$unitWon = this.$('.unit-won');
      this.$unitYuan = this.$('.unit-yuan');
      this.$totalYuan = this.$('.total-yuan');
      this.$rate = this.$('.rate');
    },
    value: function() {
      var won = this.$won.val() * 1;
      var stock = this.$stock.val() * 1;
      var unitWon = this.$unitWon.html() * 1;
      var unitYuan = this.$unitYuan.html() * 1;
      var totalYuan = this.$totalYuan.html() * 1;
      var rate = (unitYuan / unitWon).toFixed(4);
      var discount = this.$discount.val() * 1;
      return [won, rate, stock, unitWon, unitYuan, totalYuan, discount];
    },
    name: function() {
      return ['won', 'rate', 'stock', 'unit_won', 'unit_yuan', 'total_yuan', 'discount'];
    },
    exchange: function(e) {
      var self = this;
      self.$unitWon.html(self.$won.val() * self.$discount.val() / 10);
      var url = 'http://api.nyouhui.com/finance/won2yuan?won=' + this.$unitWon.html();
      $.ajax({
        url: url,
        success: function(data) {
          self.$unitYuan.html(data.data[0].number2);
          self.$totalYuan.html(self.$unitYuan.html() * self.$stock.val());
          var rate = (data.data[0].number2 / data.data[0].number1).toFixed(4);
          self.$rate.html(rate);
        }
      });
    }
  });
  return View;
});