define(["libs/client/views/base", "libs/client/jquery.scrollify"], function(Base) {
  var View = Base.extend({
    moduleName: "kangbao_show",
    events: {
      'click .screen5': 'showSharePanel',
      'click .share-panel': 'hideSharePanel',
      'click .btn-replay': 'replay',
      'click .share-mask': 'hideShareMask',
      'click .btn-share': 'showShareMask'
    },
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
          }, {
            '50': ['.screen2 opacity 1']
          }, {
            '0': ['.daka1 transform scale(1.2)'],
            '199': ['.daka1 transform scale(1)'],
            '100': ['.daka2 transform scale(1.2)'],
            '299': ['.daka2 transform scale(1)'],
            '200': ['.daka3 transform scale(1.2)'],
            '399': ['.daka3 transform scale(1)'],
            '300': ['.daka4 transform scale(1.2)'],
            '499': ['.daka4 transform scale(1)'],
            '400': ['.daka5 transform scale(1.2)'],
            '599': ['.daka5 transform scale(1)']
          }, {
            '0': ['.photo1 transform scale(1.2)'],
            '199': ['.photo1 transform scale(1)'],
            '100': ['.photo3 transform scale(1.2)'],
            '299': ['.photo3 transform scale(1)'],
            '200': ['.photo5 transform scale(1.2)'],
            '399': ['.photo5 transform scale(1)'],
            '300': ['.photo6 transform scale(1.2)'],
            '499': ['.photo6 transform scale(1)'],
            '400': ['.photo2 transform scale(1.2)'],
            '599': ['.photo2 transform scale(1)'],
            '700': ['.photo7 left 0']
          }, {
            '0': ['.screen5 .p1 opacity 1'],
            '1000': ['.screen5 .p2 opacity 1'],
            '2000': ['.screen5 .p3 opacity 1']
          }];
          var config = configs[n];
          if (config) {
            self.playConfig(config);
          }
          if (n === 4) {
            setTimeout(function() {
              self.showSharePanel();
            }, 4000);
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
    },
    showSharePanel: function() {
      this.$('.share-panel').show();
    },
    hideSharePanel: function(e) {
      this.$('.share-panel').hide();
      e.stopPropagation();
    },
    showShareMask: function() {
      this.$('.background').show();
    },
    hideShareMask: function(e) {
      this.$('.background').hide();
      e.stopPropagation();
    },
    replay: function() {
      location.href = location.pathname + location.search + '#1'
      location.reload();
    }
  });
  return View;
});