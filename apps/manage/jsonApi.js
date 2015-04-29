var jsonApi = function*(next) {

  if (this.path.match(/^\/api/)) {
    this.json = true;
  }

  yield next;
}

module.exports = jsonApi;