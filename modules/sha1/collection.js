define([ "libs/client/collections/base", "./model" ], function(Base, Model) {
  var Colletion = Base.extend({
    model: Model,
    moduleName: "sha1"
  });
  return Colletion;
});