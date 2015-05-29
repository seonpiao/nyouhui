define([ "modules/moduleRunner/index", "modules/manage_schema_item/index", "modules/manage_form/index", "modules/manage_ctrl_input/index", "modules/manage_table/index", "modules/manage_menu/index", "modules/socket/index", "modules/manage_tasksocket/index" ], function(ModuleRunner, manage_schema_item, manage_form, manage_ctrl_input, manage_table, manage_menu, socket, manage_tasksocket) {
  var modules = {
    manage_schema_item: manage_schema_item,
    manage_form: manage_form,
    manage_ctrl_input: manage_ctrl_input,
    manage_table: manage_table,
    manage_menu: manage_menu,
    socket: socket,
    manage_tasksocket: manage_tasksocket
  };
  ModuleRunner.run(modules);
});