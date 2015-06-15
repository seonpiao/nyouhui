define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_won2yuan",
    events: {
      'input input': 'exchange',
      'change select': 'exchange'
    },
    init: function() {
      this._name = this.$el.attr('data-name');
      this.$won = this.$('input[name="' + this._name + '"]');
      this.$discount = this.$('input[name="discount"]');
      this.$stock = this.$('input[name="stock"]');
      this.$unitWon = this.$('.unit-won');
      this.$unitYuan = this.$('.unit-yuan');
      this.$totalYuan = this.$('.total-yuan');
      this.$rate = this.$('.rate');
      this.$yuan = this.$('.yuan');
      this.$batch = this.$('select');
      this.$weight = this.$('input[name="weight"]');
      this.$postage = this.$('.postage');
      this.$postageYuan = this.$('.postage-yuan');
      this.type = this.$el.attr('data-type');


      this.model.db = this.$el.attr('data-db');
      this.model.collection = this.$el.attr('data-collection');
      this.listenTo(this.model, 'sync', this.initSelect.bind(this));
      this.model.fetch();
    },
    initSelect: function() {
      var self = this;
      var result = this.model.toJSON();
      var data = result.data;
      if (result.db && result.collection) {
        data = data[result.db][result.collection];
      }
      var list = data;
      this.loadTemplate('option', function(template) {
        var html = template({
          value: self.$batch.attr('data-value'),
          list: list
        });
        self.$batch.append(html);
      });
    },
    value: function() {
      var won = this.$won.val() * 1;
      if (this.type === 'simple') {
        var yuan = this.$yuan.html() * 1;
        return [won.toFixed(2), yuan.toFixed(2), this.$yuan.attr('data-rate')];
      } else {
        var stock = this.$stock.val() * 1;
        var unitWon = this.$unitWon.html() * 1;
        var unitYuan = this.$unitYuan.html() * 1;
        var rate = (unitYuan / unitWon) * 1;
        var discount = this.$discount.val() * 1;
        var batch = this.$batch.val();
        var weight = this.$weight.val() * 1;
        var postage = this.$postage.html() * 1;
        var totalYuan = this.$totalYuan.html() * 1;
        var postageYuan = this.$postageYuan.html() * 1;
        return [won.toFixed(2), rate.toFixed(4), stock, unitWon.toFixed(2), unitYuan.toFixed(2), totalYuan.toFixed(2), discount, batch, weight, postage.toFixed(2), postageYuan.toFixed(2)];
      }
    },
    name: function() {
      if (this.type === 'simple') {
        return [this._name, 'yuan', 'rate'];
      }
      return [this._name, 'rate', 'stock', 'unit_won', 'unit_yuan', 'total_yuan', 'discount', 'batch', 'weight', 'postage', 'postage_yuan'];
    },
    _getRate: function(callback) {
      var rate = this.$rate.html() * 1;
      if (rate > 0) {
        callback(rate);
      } else {
        var won = this.$unitWon.html();
        if (won <= 0) {
          won = this.$won.val()
        }
        var url = 'http://api.nyouhui.com/finance/won2yuan?won=' + won;
        $.ajax({
          url: url,
          success: function(data) {
            var rate = (data.data[0].number2 / data.data[0].number1).toFixed(4);
            callback(rate);
          }
        });
      }
    },
    exchange: function(e) {
      var self = this;
      this._getRate(function(rate) {
        self.$rate.html(rate);
        if (self.type === 'simple') {
          self.$yuan.html((self.$won.val() * rate).toFixed(2));
          self.$yuan.attr('data-rate', rate);
        } else {
          self.$unitWon.html((self.$won.val() * self.$discount.val() / 10).toFixed(2));
          self.$unitYuan.html((self.$unitWon.html() * 1 * rate).toFixed(2));
          var $selectedBatch = self.$batch.find(':selected');
          var totalWeight = $selectedBatch.attr('data-weight');
          var totalPrice = $selectedBatch.attr('data-price');
          var unitWeightPrice = totalPrice / (totalWeight * 1000);
          self.$postage.html((unitWeightPrice * self.$weight.val()).toFixed(2));
          self.$totalYuan.html(((self.$unitYuan.html() * 1 + self.$postage.html() * 1) * self.$stock.val()).toFixed(2));
          self.$postageYuan.html((self.$unitYuan.html() * 1 + self.$postage.html() * 1).toFixed(2));
        }
      });
    }
  });
  return View;
});