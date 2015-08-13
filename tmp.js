var request = require('request');
var fs = require('fs');

var formData = {
  token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ91.eyJ1aWQiOiIxMDAwMDAwMDAwMTEiLCJpYXQiOjE0Mzk0NTAxOTN9.NSoDVXwfVW88zAwmTiLR6D1we30PFIIXDO73pw7XhYw',
  // Pass data via Streams
  my_file: fs.createReadStream(__dirname + '/test.ini')
};

request.post({
  url: 'http://local.nyouhui.com:9002/resource/upload',
  formData: formData
}, function(err, res, body) {
  console.log(body)
})
