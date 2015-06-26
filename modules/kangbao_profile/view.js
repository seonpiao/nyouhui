define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "kangbao_profile",
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
    }
  });
  return View;
});