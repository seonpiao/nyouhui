define(function() {
  var provinceList;
  var prvChange = function(value, citydom, city) {
    var cityList;
    var provinceNum = provinceList.length;
    for (var i = 0; i < provinceNum; i++) {
      if (provinceList[i].name == value) {
        cityList = provinceList[i].cityArr;
      }
    }

    citydom.options.length = 0;
    var i = 0;
    _.each(cityList, function(value, key) {
      citydom.options[i] = new Option(value, key);
      if (key == city) {
        citydom.options[i].selected = true;
      }
      i++;
    });
    if (citydom.value.length == 1) {
      citydom.options[0].selected = true;
    }
  }

  var initProvcity = function(provincedom, citydom, city) {
    $.ajax({
      url: apiUrl + 'ProvinceCity/GetList',
      cache: false,
      dataType: "jsonp",
      jsonp: "jsonpCallback",
      success: function(data) {
        provinceList = data;
        var provinceNum = provinceList.length;
        provincedom.onchange = function() {
          prvChange(this.value, citydom);
        };
        var cityName;
        for (var i = 0; i < provinceNum; i++) {
          var name = provinceList[i].name
          provincedom.options[i] = new Option(name, name);
          _.each(provinceList[i].cityArr, function(value, key) {
            if (key == city) {
              provincedom.options[i].selected = true;
              cityName = provinceList[i].name;
            }
          });
        }
        prvChange(cityName || '北京市', citydom, city);
      },
      error: function() {}
    });
  };
  return {
    init: initProvcity
  };
});