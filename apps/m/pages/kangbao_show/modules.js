define(["modules/moduleRunner/index", "modules/weixin_uploadimg/index", "modules/kangbao_show/index"], function(ModuleRunner, weixin_uploadimg, kangbao_show) {
  var modules = {
    weixin_uploadimg: weixin_uploadimg,
    kangbao_show: kangbao_show
  };
  ModuleRunner.run(modules);
});