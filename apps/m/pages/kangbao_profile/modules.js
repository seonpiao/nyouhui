define([ "modules/moduleRunner/index", "modules/kangbao_profile/index", "modules/weixin_uploadimg/index" ], function(ModuleRunner, kangbao_profile, weixin_uploadimg) {
  var modules = {
    kangbao_profile: kangbao_profile,
    weixin_uploadimg: weixin_uploadimg
  };
  ModuleRunner.run(modules);
});