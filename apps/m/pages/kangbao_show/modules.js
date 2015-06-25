define([ "modules/moduleRunner/index", "modules/sha1/index", "modules/weixin_uploadimg/index", "modules/kangbao_show/index" ], function(ModuleRunner, sha1, weixin_uploadimg, kangbao_show) {
  var modules = {
    sha1: sha1,
    weixin_uploadimg: weixin_uploadimg,
    kangbao_show: kangbao_show
  };
  ModuleRunner.run(modules);
});