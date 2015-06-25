define(["libs/client/views/base", "libs/client/jquery.scrollify"], function(Base) {
  var View = Base.extend({
    moduleName: "kangbao_show",
    init: function() {
      var winWidth = $(window).width();
      var winHeight = $(window).height();
      var scale = 1;
      var $backgrounds = $('.screen .background');
      var self = this;
      // self.$el.show();
      $backgrounds.each(function(i, el) {
        var $el = $(el);
        if ($el.attr('data-scale') === 'width') {
          scale = winWidth / 320;
          $el.css({
            //保证放大后，刚好在顶部
            top: 504 * (scale - 1) / 2,
            marginTop: 0
          });
        } else {
          scale = Math.max(winWidth / 320, winHeight / 504);
        }
        self.scale = scale;
        $el.css({
          transform: 'scale(' + scale + ')'
        });
      });
      self.initScroll()
    },
    initScroll: function() {
      var self = this;
      $.scrollify({
        section: ".screen",
        easing: "easeOutExpo",
        touchExceptions: "a,input,.touchex",
        scrollSpeed: 600,
        offset: 0,
        scrollbars: false,
        after: function(n, o) {
          var configs = [{
            '100': ['.screen1 .background transform scale(' + this.scale + ')'],
            '300': ['.screen1 .self-desc left 20px'],
            '500': ['.screen1 .self-desc left 0px'],
            '700': ['.screen1 .bg left 20px', '.screen1 .at-kangbao left 35px'],
            '900': ['.screen1 .bg left 0px', '.screen1 .at-kangbao left 15px']
          }, null, {
            '0': ['.daka1 transform scale(1.2)'],
            '200': ['.daka1 transform scale(1)'],
            '400': ['.daka2 transform scale(1.2)'],
            '600': ['.daka2 transform scale(1)'],
            '800': ['.daka3 transform scale(1.2)'],
            '1000': ['.daka3 transform scale(1)'],
            '1200': ['.daka4 transform scale(1.2)'],
            '1400': ['.daka4 transform scale(1)'],
            '1600': ['.daka5 transform scale(1.2)'],
            '1800': ['.daka5 transform scale(1)']
          }];
          var config = configs[n];
          if (config) {
            self.playConfig(config);
          }
        }
      });
    },
    playConfig: function(config) {
      for (var timer in config) {
        (function(timer) {
          setTimeout(function() {
            $.each(config[timer], function(index, value) {
              var arr = value.match(/^(.+) (.+) (.+)/);
              var selector = arr[1];
              var style = arr[2];
              var newValue = arr[3];
              $(selector).css(style, newValue);
            });
          }, timer);
        })(timer)
      }
    }
  });
  return View;
});