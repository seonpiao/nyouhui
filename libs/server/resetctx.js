module.exports = function*() {
  this.result = null;
  this.locals = null;
  this.body = null;
  this.maxTry = 3;
  this.tried = 0;
  this.status = 404;
  this.global = {};
}