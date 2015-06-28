var thunkify = require('thunkify');
var request = require('request');
var path = require('path');
var cp = require('child_process');
var fs = require('fs');

var token, jsapiTicket;

function* refreshToken() {
  var appid = 'wx8cfeb90d2826a007';
  var appsec = 'e94128f0d35ea2cb3667b7f60864a409';
  var now = Date.now();
  if (!token || (now - token.timestamp > 6000 * 1000)) {
    var result =
      yield thunkify(request)({
        url: 'https://api.weixin.qq.com/cgi-bin/token',
        qs: {
          grant_type: 'client_credential',
          appid: appid,
          secret: appsec
        }
      });
    if (result) {
      var body = result[1];
      token = JSON.parse(body);
      token.timestamp = now;
    }
  }
  return token;
}

function* getTicket() {
  if (!token) {
    yield refreshToken();
  }
  var result =
    yield thunkify(request)({
      url: 'https://api.weixin.qq.com/cgi-bin/ticket/getticket',
      qs: {
        access_token: token.access_token,
        type: 'jsapi'
      }
    });
  if (result) {
    var body = result[1];
    var data = JSON.parse(body);
  }
  if (!data || !data.ticket) {
    token = null;
    return yield getTicket();
  }
  return data;
}

module.exports = function(app) {

  var route = app.route('/weixin');

  route.nested('/token').get(function*(next) {
    this.json = true;
    var result =
      yield refreshToken();
    this.result = {
      code: 0,
      result: {
        token: result.access_token,
        expires: result.expires_in
      }
    }
  });

  route.nested('/ticket').get(function*(next) {
    this.json = true
    var now = Date.now();
    if (!jsapiTicket) {
      jsapiTicket = yield getTicket();
    }
    this.result = {
      code: 0,
      result: {
        ticket: jsapiTicket.ticket,
        expires: jsapiTicket.expires_in,
        timestamp: now
      }
    };
  });

  route.nested('/downmedia').get(function*(next) {
    this.json = true;
    var mediaId = this.request.query.media_id;
    if (!token) {
      yield refreshToken();
    }
    var result =
      yield thunkify(request)({
        url: 'http://file.api.weixin.qq.com/cgi-bin/media/get',
        qs: {
          access_token: token.access_token,
          media_id: mediaId
        },
        encoding: null
      });
    this.type = result[0].headers['content-type'];
    var extname = this.type.replace(/.*\//, '');
    var fileName = mediaId + '.' + extname;
    var tmpFile = path.join(__dirname, fileName);
    yield thunkify(fs.writeFile.bind(fs))(tmpFile, result[1]);
    var remoteDir = path.join(app.config.upload.path, 'weixin_upload');
    yield thunkify(cp.exec.bind(cp))('ssh root@' + app.config.upload.host + ' "mkdir -p ' + remoteDir + '"')
    yield thunkify(cp.exec.bind(cp))('scp ' + tmpFile + ' root@' + app.config.upload.host + ':' + path.join(remoteDir, fileName))
    yield thunkify(cp.exec.bind(cp))('rm -f ' + tmpFile);
    this.result = {
      code: 0,
      result: {
        url: 'http://' + this.global.base['static'] + '/weixin_upload/' + fileName
      }
    };
  });
};