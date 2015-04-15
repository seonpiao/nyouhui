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

var APP_PATH = path.join(__dirname, 'apps');

function init(app, pagePath) {
  app.use(views(pagePath, {
    default: 'jade',
    cache: process.env.NODE_ENV === 'production' ? true : false
  }));

  //parse body
  app.use(body());

  //default routing
  defaultRoute(app);

  //routing
  app.use(routing(app));
}


var argv = process.argv;

var apps = argv[2].split(',');

var port = argv[3];
if (port) {
  port = port.split(',');
}
var domain = argv[4];
global.WLY_DOMAIN = domain || 'wanleyun.com';

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
      this.page = this.page || this.path.substring(1);
    }
    this.global.page = this.page;
    this.view = this.view || 'index';
    yield response.call(this);
  });
};

var bases = {
  'nvshen.zongyi.letv.com': {
    i: '2', //把i拼到后面
    mm: '3' //保持域名不变
  },
  'defaults': {
    i: '1', //替换同级子域
    mm: '1' //替换同级子域
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
  var appPath = path.join(APP_PATH, appName)
  var appConfig = require(path.join(appPath, 'config.js'));
  var pagePath = path.join(appPath, 'pages');
  var pageNames = fs.readdirSync(pagePath);
  var app = koa();
  init(app, pagePath);
  pageNames.forEach(function(pageName) {
    var routePath = path.join(pagePath, pageName, 'route.js');
    if (fs.existsSync(routePath)) {
      var route = require(routePath);
      route(app, pageName);
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