var template = require('art-template');
var fs = require('fs');
var path = require('path');

module.exports = function(app) {
  app.route('/install').get(function*(next) {
    this.result = {};
  }).post(function*(next) {
    var body = this.request.body;
    var tmpl = fs.readFileSync(path.join(__dirname, 'config.tmpl')).toString();
    var configFile = (template.compile(tmpl)(body));
    fs.writeFileSync(path.join(__dirname, '../../config2.js'), configFile);
    this.raw = true;
    this.result = '安装完成';
  });
}