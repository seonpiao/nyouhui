define([ "libs/client/collections/base", "./model" ], function(Base, Model) {
  var Colletion = Base.extend({
    model: Model,
    moduleName: "kangbao_show"
  });
  return Colletion;
});