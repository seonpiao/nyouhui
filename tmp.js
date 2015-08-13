var request = require('request');
var fs = require('fs');

var formData = {
  token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.1eyJ1aWQiOiIxMDAwMDAwMDAwMTciLCJpYXQiOjE0Mzk0NTE3NDR9.W7DtnxUrEdNxb3k2ydtGWN1A2E6RMiFuHLYAQnwpp3s',
  // Pass data via Streams
  my_file: fs.createReadStream('/Users/seon/Downloads/MotoX2专用adb及fastboot组件.zip')
};

request.post({
  url: 'http://local.nyouhui.com:9002/resource/upload',
  // url: 'http://api.test.bylh.tv/resource/upload',
  formData: formData
}, function(err, res, body) {
  console.log(err || res)
})
