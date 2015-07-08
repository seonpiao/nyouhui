var padnum = require('padnum');
var thunkify = require('thunkify');
var request = require('request');
var captchas = {};

var captchasCache = function(key, captcha) {
  var keys = Object.keys(captchas);
  if (keys.length > 100000) {
    delete captchas[keys.shift()];
  }
  captchas[key] = {
    captcha: captcha,
    time: Date.now()
  };
};

var verifyCaptcha = function(key, captcha) {
  var now = Date.now();
  var cached = captchas[key];
  delete captchas[key];
  if (cached && captcha == cached.captcha && (now - cached.time < 10 * 60 * 1000)) {
    return true;
  }
  return false;
};

var sendCaptchaBySms = function*(phone) {
  var captcha = getCaptcha(phone);
  var max = 3;
  var tried = 0;
  var result;
  while (tried < max) {
    try {
      // result = yield thunkify(request)({
      //   url: 'http://yunpian.com/v1/sms/send.json',
      //   method: 'POST',
      //   form: {
      //     mobile: phone,
      //     apikey: '6d29b1b3847725fd4b00d88b47af48da',
      //     text: '【云片网】您的验证码是' + captcha + '。如非本人操作，请忽略本短信'
      //   }
      // });
      // result = JSON.parse(result[1]);
      break;
    } catch (e) {
      tried++;
    }
  }
  if (tried === max) {
    // throw new Error('Network error');
  }

  // if (result.code !== 0) {
  //   throw new Error(result.msg);
  // }

  return captcha;
};

var getCaptcha = function(key) {
  var captcha = padnum(parseInt(Math.random() * 10000).toString(), 4);
  captchasCache(key, captcha);
  return captcha
};

var getCachedCaptcha = function(key) {
  var cached = captchas[key];
  var captcha;
  if (cached) {
    captcha = cached.captcha
  } else {
    captcha = getCaptcha(key);
  }
  return captcha;
};

module.exports = {
  getCaptcha: getCaptcha,
  getCachedCaptcha: getCachedCaptcha,
  sendCaptchaBySms: sendCaptchaBySms,
  verifyCaptcha: verifyCaptcha
}