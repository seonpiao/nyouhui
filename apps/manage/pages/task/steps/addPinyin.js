var Mongo = require('../../../../../libs/server/mongodb');
var pinyin = require('pinyin');

module.exports = {
  input: ['data', 'pinyinKeys'],
  output: ['data'],
  go: function(data, done) {
    var _data = data.data;
    var pinyinKeys = data.pinyinKeys;
    pinyinKeys.forEach(function(key) {
      if (_data[key]) {
        var fullPinyin = pinyin(_data[key], {
          style: pinyin.STYLE_NORMAL,
          heteronym: true
        });
        var allFullPinyin = [''];
        fullPinyin.forEach(function(single) {
          var tmp = [];
          allFullPinyin.forEach(function(string) {
            single.forEach(function(word) {
              tmp.push(string + word);
            });
          });
          allFullPinyin = tmp;
        });
        _data['__' + key + '_pinyin'] = allFullPinyin.join('').toLowerCase();
        var firstLetter = pinyin(_data[key], {
          style: pinyin.STYLE_FIRST_LETTER,
          heteronym: true
        });
        var allFirstLetter = [''];
        firstLetter.forEach(function(single) {
          var tmp = [];
          allFirstLetter.forEach(function(string) {
            single.forEach(function(word) {
              tmp.push(string + word);
            });
          });
          allFirstLetter = tmp;
        });
        _data['__' + key + '_suoxie'] = allFirstLetter.join('').toLowerCase();
      }
    });
    done(null, {
      data: _data
    })
  }
};
