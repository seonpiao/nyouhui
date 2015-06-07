define([ "libs/client/collections/base", "./model" ], function(Base, Model) {
  var Colletion = Base.extend({
    model: Model,
    moduleName: "manage_ctrl_won2yuan"
  });
  return Colletion;
});