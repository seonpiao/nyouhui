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
        var keys = _data['__' + key + '_pinyin'] = [];
        var fullPinyin = pinyin(_data[key], {
          style: pinyin.STYLE_NORMAL,
          heteronym: true
        });
        var firstLetter = pinyin(_data[key], {
          style: pinyin.STYLE_FIRST_LETTER,
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
        allFullPinyin.forEach(function(fullPinyin) {
          for (var i = 1; i <= fullPinyin.length; i++) {
            keys.push(fullPinyin.substring(0, i));
          }
        });
        allFirstLetter.forEach(function(firstLetter) {
          for (var i = 1; i <= firstLetter.length; i++) {
            keys.push(firstLetter.substring(0, i));
          }
        });
        for (var i = 1; i <= _data[key].length; i++) {
          keys.push(_data[key].substring(0, i));
        }
      }
    });
    done(null, {
      data: _data
    })
  }
};
