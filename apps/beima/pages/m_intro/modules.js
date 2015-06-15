define([ "modules/moduleRunner/index", "modules/beima_intro_cover/index", "modules/beima_intro_content/index", "modules/beima_bottom_qrcode/index" ], function(ModuleRunner, beima_intro_cover, beima_intro_content, beima_bottom_qrcode) {
  var modules = {
    beima_intro_cover: beima_intro_cover,
    beima_intro_content: beima_intro_content,
    beima_bottom_qrcode: beima_bottom_qrcode
  };
  ModuleRunner.run(modules);
});