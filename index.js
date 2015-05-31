var fs = require('fs');
var logger = require('log4js').getLogger('page:index');
var _ = require('underscore');
var koa = require('koa');
var path = require('path');
var routing = require('koa-routing');
var views = require('koa-views');
var body = require('koa-body');
var resetctx = require('./libs/server/resetctx');
var response = require('./libs/server/response');
var staticServe = require('koa-static');

var APP_PATH = path.join(__dirname, 'apps');

function init(app, options) {
  var appPath = options.appPath;
  var appConfig = options.appConfig;
  var pagePath = path.join(appPath, 'pages');
  var wwwPath = path.join(appPath, 'www');

  app.config = appConfig;

  app.use(views(pagePath, {
    default: 'jade',
    cache: process.env.NODE_ENV === 'production' ? true : false
  }));

  //parse body
  app.use(body());

  //default routing
  defaultRoute(app);

  if (appConfig.middlewares) {
    appConfig.middlewares.forEach(function(middleware) {
      app.use(middleware);
    });
  }

  //routing
  app.use(routing(app));

  //static
  app.use(staticServe(wwwPath, {
    maxage: 3600 * 24 * 30 * 1000,
    defer: true
  }));
}


var argv = process.argv;

var apps = argv[2].split(',');

var port = argv[3];
if (port) {
  port = port.split(',');
}
var domain = process.env.DOMAIN;
global.DOMAIN = domain || 'nyouhui.com';

var defaultRoute = function(app) {
  app.use(function*(next) {
    var self = this;
    yield resetctx.call(this);
    var baseRule;
    _.some(bases, function(item, key) {
      var exp = new RegExp(sanitize(key));
      if (self.host.match(exp)) {
        baseRule = item;
        return true;
      }
      return false;
    });
    if (!baseRule) {
      baseRule = bases.defaults;
    }
    this.global.base = {};
    _.forEach(baseRule, function(val, key) {
      self.global.base[key] = rules[val](self.host, key);
    });
    yield next;
    if (!this.result) {
      this.global.girlid = 0;
      this.page = '404';
    } else {
      this.result.query = this.request.query;
      this.result.path = this.path;
      this.page = this.page || this.path.substring(1).replace(/\/.*/, '');
    }
    this.global.page = this.page;
    this.view = this.view || 'index';
    yield response.call(this);
  });
};

var bases = {
  'defaults': {
    www: '1', //替换同级子域
    m: '1' //替换同级子域
  }
};

var rules = {
  //同子域替换
  '1': function(host, subdomain) {
    return host.replace(/^[^\.]+/, subdomain);
  },
  '2': function(host, subdomain) {
    return host + '/' + subdomain;
  },
  //保持原域名
  '3': function(host, subdomain) {
    return host;
  }
};

var sanitize = function(s) {
  return s.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

apps.forEach(function(appName, i) {
  var app = koa();
  var appPath = path.join(APP_PATH, appName)
  var appConfig = require(path.join(appPath, 'config.js'));
  if (_.isFunction(appConfig)) {
    appConfig = appConfig(app);
  }
  var pagePath = path.join(appPath, 'pages');
  var pageNames = fs.readdirSync(pagePath);
  init(app, {
    appPath: appPath,
    appConfig: appConfig
  });
  pageNames.forEach(function(pageName) {
    var routePath = path.join(pagePath, pageName, 'route.js');
    if (fs.existsSync(routePath)) {
      var route = require(routePath);
      route(app, pageName, appConfig);
    } else {
      app.route('/' + pageName).all(function*(next) {
        this.result = {};
        this.global.girlid = 0;
        this.global.page = pageName;
        this.template = pageName + '/index';
      });
    }
  });
  var appPort = appConfig.port;
  if (port && port[i]) {
    appPort = port[i];
  }
  logger.info('App[' + appName + '] listening: ' + appPort);
  app.listen(appPort);
});