define(function() {
  var Model = Backbone.Model.extend({
    idAttribute: '_id',
    db: 'nyouhui',
    prefix: '/api',
    initialize: function(options) {
      options = options || {};
      if (options.module) {
        this.module = options.module;
      }
      this.init.apply(this, arguments);
    },
    fetch: function() {
      this.method = 'read';
      return Backbone.Model.prototype.fetch.apply(this, arguments);
    },
    save: function(key, val, options) {
      options = options || {};
      this.method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
      return Backbone.Model.prototype.save.apply(this, arguments);
    },
    destroy: function() {
      this.method = 'delete';
      return Backbone.Model.prototype.destroy.apply(this, arguments);
    },
    url: function() {
      if (this.method === 'create') {
        return this.prefix + '/' + this.db + '/' + this.collection;
      } else {
        return this.prefix + '/' + this.db + '/' + this.collection + '/' + (this.id ? this.id : '');
      }
    },
    parse: function(resp) {
      if (resp.code === 200) {
        return resp.result;
      }
      this.error = resp;
      return {};
    },
    cache: function(options, callback) {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }
      callback = callback || function() {};
      if (_.keys(this.attributes).length > 0) {
        callback();
      } else {
        this.once('sync', function() {
          callback();
        });
        this.fetch(options);
      }
    },
    commafy: function(num) {
      //1.先去除空格,判断是否空值和非数   
      num = num + "";
      num = num.replace(/[ ]/g, ""); //去除空格  
      if (num == "") {
        return;
      }
      if (isNaN(num)) {
        return;
      }
      //2.针对是否有小数点，分情况处理   
      var index = num.indexOf(".");
      if (index == -1) { //无小数点   
        var reg = /(-?\d+)(\d{3})/;
        while (reg.test(num)) {
          num = num.replace(reg, "$1,$2");
        }
      } else {
        var intPart = num.substring(0, index);
        var pointPart = num.substring(index + 1, num.length);
        var reg = /(-?\d+)(\d{3})/;
        while (reg.test(intPart)) {
          intPart = intPart.replace(reg, "$1,$2");
        }
        num = intPart + "." + pointPart;
      }
      return num;
    },
    init: function() {}
  });
  return Model;
});