define([ "modules/moduleRunner/index", "modules/manage_table/index", "modules/manage_schema_item/index", "modules/manage_form/index", "modules/manage_ctrl_input/index", "modules/manage_menu/index" ], function(ModuleRunner, manage_table, manage_schema_item, manage_form, manage_ctrl_input, manage_menu) {
  var modules = {
    manage_table: manage_table,
    manage_schema_item: manage_schema_item,
    manage_form: manage_form,
    manage_ctrl_input: manage_ctrl_input,
    manage_menu: manage_menu
  };
  ModuleRunner.run(modules);
});