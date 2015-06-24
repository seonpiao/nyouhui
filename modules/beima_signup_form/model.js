define(["libs/client/models/base"], function(Base) {
  var Model = Base.extend({
    db: 'firstre',
    collection: 'beima_postulant',
    prefix: 'http://api.firstre.cn/data'
  });
  return Model;
});