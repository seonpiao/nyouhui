define([ "modules/moduleRunner/index", "modules/manage_table/index", "modules/manage_schema_item/index", "modules/manage_form/index", "modules/manage_ctrl_input/index", "modules/manage_menu/index", "modules/manage_ctrl_tagsinput/index", "modules/manage_ctrl_select/index" ], function(ModuleRunner, manage_table, manage_schema_item, manage_form, manage_ctrl_input, manage_menu, manage_ctrl_tagsinput, manage_ctrl_select) {
  var modules = {
    manage_table: manage_table,
    manage_schema_item: manage_schema_item,
    manage_form: manage_form,
    manage_ctrl_input: manage_ctrl_input,
    manage_menu: manage_menu,
    manage_ctrl_tagsinput: manage_ctrl_tagsinput,
    manage_ctrl_select: manage_ctrl_select
  };
  ModuleRunner.run(modules);
});