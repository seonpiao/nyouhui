var thunkify = require('thunkify');
var request = require('request');

var token, jsapiTicket;

function* refreshToken() {
  var appid = 'wxd03c0faf00969a98';
  var appsec = 'ff732d23e3d41d306d2c160a27aedd37';
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
    if (!jsapiTicket || (now - token.timestamp > 6000 * 1000) || token.errcode === 42001) {
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
        jsapiTicket = JSON.parse(body);
      }
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
    this.raw = true;
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
        }
      });
    console.log(result[1]);
  });
};