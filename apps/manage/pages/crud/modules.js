define([ "modules/moduleRunner/index", "modules/manage_table/index", "modules/manage_schema_item/index", "modules/manage_form/index", "modules/manage_ctrl_input/index", "modules/manage_menu/index", "modules/manage_ctrl_tagsinput/index", "modules/manage_ctrl_wizard/index", "modules/manage_ctrl_select/index", "modules/manage_ctrl_textarea/index", "modules/manage_ctrl_editor/index", "modules/manage_ctrl_draggableselector/index", "modules/manage_ctrl_checkbox/index", "modules/socket/index", "modules/manage_tasksocket/index", "modules/manage_ctrl_won2yuan/index", "modules/manage_ctrl_autocomplete/index", "modules/manage_ctrl_datepicker/index", "modules/manage_ctrl_continue/index", "modules/manage_ctrl_contentblock/index", "modules/editor/index", "modules/manage_ctrl_adminprivilege/index", "modules/manage_ctrl_checkboxselect/index", "modules/manage_ctrl_fileuploader/index", "modules/manage_ctrl_saishiurl/index" ], function(ModuleRunner, manage_table, manage_schema_item, manage_form, manage_ctrl_input, manage_menu, manage_ctrl_tagsinput, manage_ctrl_wizard, manage_ctrl_select, manage_ctrl_textarea, manage_ctrl_editor, manage_ctrl_draggableselector, manage_ctrl_checkbox, socket, manage_tasksocket, manage_ctrl_won2yuan, manage_ctrl_autocomplete, manage_ctrl_datepicker, manage_ctrl_continue, manage_ctrl_contentblock, editor, manage_ctrl_adminprivilege, manage_ctrl_checkboxselect, manage_ctrl_fileuploader, manage_ctrl_saishiurl) {
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
    manage_tasksocket: manage_tasksocket,
    manage_ctrl_won2yuan: manage_ctrl_won2yuan,
    manage_ctrl_autocomplete: manage_ctrl_autocomplete,
    manage_ctrl_datepicker: manage_ctrl_datepicker,
    manage_ctrl_continue: manage_ctrl_continue,
    manage_ctrl_contentblock: manage_ctrl_contentblock,
    editor: editor,
    manage_ctrl_adminprivilege: manage_ctrl_adminprivilege,
    manage_ctrl_checkboxselect: manage_ctrl_checkboxselect,
    manage_ctrl_fileuploader: manage_ctrl_fileuploader,
    manage_ctrl_saishiurl: manage_ctrl_saishiurl
  };
  ModuleRunner.run(modules);
});