define(['libs/client/domWatcher'], function(DomWatcher) {
  var moduleId = 0;
  var activeModules = [];
  if (!window.__domWatcher) {
    window.__domWatcher = new DomWatcher();
  }
  __domWatcher.doc = document;
  //当组件从页面中摘除时，需要取消组件的事件监听
  __domWatcher.onremove('[data-module]', function(els) {
    els.each(function(i, el) {
      var view = el.__view;
      //当$(el).data('view')存在时，说明并不是要真正摘除这个节点，可能是append到另外的地方，因此不能取消事件监听
      if (view && !$(el).data('view')) {
        // if (view) {
        view.stopListening();
        if (view.destroy) {
          view.destroy();
        }
      }
    });
  });
  return {
    run: function(modules) {
      for (var name in modules) {
        var module = modules[name];
        if (!module) continue;
        try {
          if (module.init) {
            (function(module) {
              __domWatcher.exist('[data-module="' + name + '"]', function(el) {
                el.each(function(i, el) {
                  //移动dom节点，el仍然是同一个dom对象，但是会生成一个新的moduleid
                  el.__module_id = moduleId++;
                  el = $(el);
                  if (el[0].className === 'filterlist') {}
                  // setTimeout(function() {
                  if (!el.data('view')) {
                    if (el[0].className === 'filterlist') {}
                    module.init(el);
                  }
                  // })
                });
              });
            })(module);
          }
        } catch (e) {
          console.error(e.stack);
        }
      }
    }
  }
});