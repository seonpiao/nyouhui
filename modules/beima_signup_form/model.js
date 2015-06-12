define(["libs/client/models/base"], function(Base) {
  var Model = Base.extend({
    db: 'firstre',
    collection: 'beima_postulant',
    prefix: 'http://api_firstre.dev.wanleyun.com/data'
  });
  return Model;
});