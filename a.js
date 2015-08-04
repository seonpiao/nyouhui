var request = require('request');

request({
  url: 'http://api.test.bylh.tv/resource/get?resource_id=55bf278247d6812a50b91ea4&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOiIxMDAwMDAwMDAwMTciLCJpYXQiOjE0Mzg1ODcwMDJ9.UPa1r-OJVRAQgScIEXIG9Cl7UzRlSIoYKdumGRq6muY',
  headers: {
    'x-cors': 'enable',
    'origin': 'http://baidu.com'
  }
}, function(err, res, body) {
  console.log(res.headers);
})
