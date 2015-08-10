var co = require('co');

module.exports = {
  input: ['data'],
  output: ['data'],
  go: function(data, done) {
    var _data = data.data;
    var goodsName = _data.name;
    var count = _data.count;
    var goods =
      yield Mongo.request({
        db: 'cl',
        collection: 'goods',
        request: {
          qs: {
            query: JSON.stringify({
              name: goodsName
            })
          }
        }
      });
    goods = goods['cl']['goods'];
    if (goods && goods.length > 0) {
      var changedItems = [];
      for (var i = 0; i < goods.length; i++) {
        var item = goods[i];
        if (count > 0) {
          if (item.stock >= count) {
            item.stock -= count;
            count = 0;
            changedItems.push(item);
            break;
          } else {
            count -= item.stock;
            item.stock = 0;
            changedItems.push(item);
          }
        }
      }
      if (count > 0) {
        this.result = {
          code: 500,
          message: '库存不足'
        }
        return;
      } else {
        for (var i = 0; i < changedItems.length; i++) {
          var item = changedItems[i];
          item.total_yuan = item.stock * item.unit_yuan;
          var goodsId = item._id + '';
          delete item._id;
          yield Mongo.request({
            db: 'cl',
            collection: 'goods',
            id: goodsId,
            request: {
              method: 'put',
              json: item
            }
          });
        }
      }
    }
    done();
  }
};
