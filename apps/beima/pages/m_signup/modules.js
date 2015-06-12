define([ "modules/moduleRunner/index", "modules/beima_signup_logo/index", "modules/beima_signup_form/index", "modules/beima_bottom_qrcode/index" ], function(ModuleRunner, beima_signup_logo, beima_signup_form, beima_bottom_qrcode) {
  var modules = {
    beima_signup_logo: beima_signup_logo,
    beima_signup_form: beima_signup_form,
    beima_bottom_qrcode: beima_bottom_qrcode
  };
  ModuleRunner.run(modules);
});