module.exports = function(app, pageName) {
  app.route('/').all(function*(next) {
    this.result = {};
    this.page = 'index';
  });
}