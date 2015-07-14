var errorMsgs = {
  404: 'Not found.',
  403: 'Not Allowed',
  500: 'Internal error.'
}

var _ = require('underscore');
var moment = require('moment');

module.exports = function*(view) {
  if (this.status === 301 || this.status === 302) {
    return;
  }

  var defaultLocals = {
    __env: {
      NODE_ENV: process.env.NODE_ENV,
      DOMAIN: global.DOMAIN
    },
    __global: this.global || {}
  };

  var requestInfo = {
    query: this.request.query,
    path: this.path
  }

  this.locals = this.locals || defaultLocals;


  if (!this.result && !this.body) {
    if (this.status) {
      this.body = errorMsgs[this.status] || 'Unknown Error.';
    } else {
      this.status = 404;
      try {
        //如果有自定义的404页面，就渲染404页面
        yield this.render(this.page + '/' + this.view);
      } catch (e) {
        this.body = 'Not found';
      }
    }
    return;
  }

  if (this.json) {
    this.body = this.result || {};
    this.body.time = Date.now();
  } else if (this.text || this.raw) {
    this.body = this.result || '';
  } else {
    this.locals = this.result
  }

  if (this.json) {
    this.status = 200;
    _.extend(this.body, requestInfo);
    // _.extend(this.body, defaultLocals);
  } else if (this.text || this.raw) {
    this.status = 200;
  } else if (this.body && typeof this.body.pipe === 'function') {
    this.status = 200;
  } else {
    _.extend(this.locals, defaultLocals);
    _.extend(this.locals, requestInfo);
    this.status = 200;
    yield this.render(this.page + '/' + this.view);
  }
}
