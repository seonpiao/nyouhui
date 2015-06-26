define([ "modules/moduleRunner/index", "modules/kangbao_profile/index" ], function(ModuleRunner, kangbao_profile) {
  var modules = {
    kangbao_profile: kangbao_profile
  };
  ModuleRunner.run(modules);
});