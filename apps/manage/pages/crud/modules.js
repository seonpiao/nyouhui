define([ "modules/moduleRunner/index", "modules/manage_table/index", "modules/manage_schema_item/index", "modules/manage_form/index", "modules/manage_ctrl_input/index", "modules/manage_menu/index", "modules/manage_ctrl_tagsinput/index", "modules/manage_ctrl_wizard/index", "modules/manage_ctrl_select/index", "modules/manage_ctrl_textarea/index", "modules/manage_ctrl_editor/index", "modules/manage_ctrl_draggableselector/index", "modules/manage_ctrl_checkbox/index", "modules/socket/index", "modules/manage_tasksocket/index" ], function(ModuleRunner, manage_table, manage_schema_item, manage_form, manage_ctrl_input, manage_menu, manage_ctrl_tagsinput, manage_ctrl_wizard, manage_ctrl_select, manage_ctrl_textarea, manage_ctrl_editor, manage_ctrl_draggableselector, manage_ctrl_checkbox, socket, manage_tasksocket) {
  var modules = {
    manage_table: manage_table,
    manage_schema_item: manage_schema_item,
    manage_form: manage_form,
    manage_ctrl_input: manage_ctrl_input,
    manage_menu: manage_menu,
    manage_ctrl_tagsinput: manage_ctrl_tagsinput,
    manage_ctrl_wizard: manage_ctrl_wizard,
    manage_ctrl_select: manage_ctrl_select,
    manage_ctrl_textarea: manage_ctrl_textarea,
    manage_ctrl_editor: manage_ctrl_editor,
    manage_ctrl_draggableselector: manage_ctrl_draggableselector,
    manage_ctrl_checkbox: manage_ctrl_checkbox,
    socket: socket,
    manage_tasksocket: manage_tasksocket
  };
  ModuleRunner.run(modules);
});