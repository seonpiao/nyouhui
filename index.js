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
var co = require('co');
var parse = require('co-busboy');

var APP_PATH = path.join(__dirname, 'apps');

var randomPort = function() {
  var port = Math.ceil(10000 + Math.random() * 10000);
  return port;
};

var listenPort = function(app, port) {
  if (!port) {
    port = randomPort();
  }
  try {
    app.listen(port);
    logger.info('App[' + app.name + '] listening: ' + port);
  } catch (e) {
    listenPort(app);
  }
};

function init(app, options) {
  var appPath = options.appPath;
  var appConfig = options.appConfig;
  var pagePath = path.join(appPath, 'pages');
  var wwwPath = path.join(appPath, 'www');

  app.use(function*(next) {
    yield resetctx.call(this);
    yield next;
  });

  app.use(views(pagePath, {
    default: 'jade',
    cache: process.env.NODE_ENV === 'production' ? true : false
  }));

  //parse body
  app.use(body({
    jsonLimit: '100mb'
  }));

  //default routing
  defaultRoute(app);

  if (app.Middlewares) {
    app.Middlewares.forEach(function(middleware) {
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

var apps = [],
  port;
var argv = process.argv;

if (argv.length > 2) {
  apps = argv[2].split(',');

  port = argv[3];
  if (port) {
    port = port.split(',');
  }
}
var domain = process.env.DOMAIN;
global.DOMAIN = domain || 'nyouhui.com';

var defaultRoute = function(app) {
  app.use(function*(next) {
    var self = this;
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
      this.page = '404';
    } else {
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
    m: '1', //替换同级子域
    'static': '1', //替换同级子域
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

function isGeneratorFunction(obj) {
  return obj && obj.constructor && 'GeneratorFunction' == obj.constructor.name;
}

co(function*() {
  var allConfig = require(path.join(APP_PATH, 'config.js'));
  var appConfigs = allConfig.apps;
  delete allConfig.apps;
  for (var i = 0; i < apps.length; i++) {
    var appName = apps[i];
    var app = koa();
    app.name = appName;
    var appPath = path.join(APP_PATH, appName);
    var appConfig;
    try {
      appConfig = _.extend(allConfig, appConfigs[appName] || {});
      app.config = appConfig;
      var runScript = require(path.join(appPath, 'run.js'));
      if (isGeneratorFunction(runScript)) {
        yield runScript(app);
      } else if (_.isFunction(runScript)) {
        runScript(app);
      }
    } catch (e) {
      logger.error(e.stack)
    }
    init(app, {
      appPath: appPath,
      appConfig: appConfig
    });
    var pagePath = path.join(appPath, 'pages');
    var pageNames = fs.readdirSync(pagePath);
    pageNames.forEach(function(pageName) {
      try {
        var routePath = path.join(pagePath, pageName, 'route.js');
        if (fs.existsSync(routePath)) {
          var route = require(routePath);
          route(app, pageName, appConfig);
        } else {
          app.route('/' + pageName).all(function*(next) {
            this.result = {};
            this.global.page = pageName;
            this.template = pageName + '/index';
          });
        }
      } catch (e) {
        logger.error(e.stack);
      }
    });

    var appPort = appConfig.port;
    if (port && port[i]) {
      appPort = port[i];
    }
    listenPort(app, appPort);
  }
})(function(err) {
  if (err) {
    logger.error(err);
  }
  // process.exit(0);
});
