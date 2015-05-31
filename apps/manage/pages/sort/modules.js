define([ "modules/moduleRunner/index", "modules/manage_ctrl_sort/index", "modules/manage_form/index", "modules/manage_ctrl_input/index" ], function(ModuleRunner, manage_ctrl_sort, manage_form, manage_ctrl_input) {
  var modules = {
    manage_ctrl_sort: manage_ctrl_sort,
    manage_form: manage_form,
    manage_ctrl_input: manage_ctrl_input
  };
  ModuleRunner.run(modules);
});