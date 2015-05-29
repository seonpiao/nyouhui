define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "socket",
    init: function() {
      this._socket = io('http://' + __global.socket.host + ':' + __global.socket.port + '/');
    },
    socket: function() {
      return this._socket;
    }
  });
  return View;
});