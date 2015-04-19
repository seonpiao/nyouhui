define([ "modules/moduleRunner/index", "modules/manage_schema_item/index", "modules/manage_schema_def/index" ], function(ModuleRunner, manage_schema_item, manage_schema_def) {
  var modules = {
    manage_schema_item: manage_schema_item,
    manage_schema_def: manage_schema_def
  };
  ModuleRunner.run(modules);
});