define([ "modules/moduleRunner/index", "modules/firstre_event_activity/index" ], function(ModuleRunner, firstre_event_activity) {
  var modules = {
    firstre_event_activity: firstre_event_activity
  };
  ModuleRunner.run(modules);
});