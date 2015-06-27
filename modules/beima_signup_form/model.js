define(["libs/client/models/base"], function(Base) {
  var Model = Base.extend({
    db: 'firstre',
    collection: 'beima_postulant',
    prefix: 'http://localhost:9003/data'
  });
  return Model;
});