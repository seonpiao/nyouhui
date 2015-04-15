define(["libs/client/models/base"], function(Base) {
  var Model = Base.extend({
    parse: function(resp) {
      var isSuccess = false;
      var dataKey = 'data';
      var codeKey = 'code';
      var msgKey = 'msg';
      if ('code' in resp) {
        if (resp.code === 1) {
          isSuccess = true;
        }
      } else if ('success' in resp) {
        dataKey = 'result';
        codeKey = 'error_code';
        msgKey = 'error_msg';
        if (resp.success === 200) {
          isSuccess = true;
        }
      }
      var data = resp[dataKey];
      var self = this;
      if (isSuccess) {
        _.each(this.attributes, function(val, key) {
          if (!(key in data)) {
            self.unset(key);
          }
        });
        return data;
      } else {
        this.clear();
        return {
          error_code: resp[codeKey],
          error_msg: resp[msgKey]
        };
      }
      return resp;
    }
  });
  return Model;
});