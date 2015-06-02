var padnum = require('padnum');
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