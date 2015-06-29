define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "kangbao_profile",
    events: {
      'click .placeholder': 'uploadImg',
      'click .reupload': 'reupload',
      'change .screen1 input': 'check',
      'click .share-mask': 'hideShareMask',
      'click .share': 'showShareMask'
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
    },
    shareSuccess: function() {
      alert('分享成功');
    },
    check: function() {
      var self = this;
      var name = this.$('.edit-name input').val();
      var no = this.$('.edit-no input').val();
      if (this.url && name && no) {
        $.ajax({
          url: 'http://api.firstre.cn/data/kangbao/uploadimg',
          method: 'post',
          dataType: 'json',
          contentType: 'application/json',
          data: JSON.stringify({
            media_id: self.mediaId,
            url: this.url,
            name: name,
            no: no
          }),
          success: function() {
            self.$('.screen2 .preview .background').css({
              backgroundImage: 'url(' + self.url + ')'
            });
            self.$('.self-desc').html('我是' + name + '，岗位' + no);
            self.$('.screen1').hide();
            self.$('.screen2').show();
            wx.onMenuShareTimeline({
              title: '我在康保马拉松守护跑友的生命安全，我是第一反应人', // 分享标题
              link: 'http://m.firstre.cn/kangbao_show?id=' + self.mediaId + '#1', // 分享链接
              imgUrl: 'http://' + __global.base["static"] + '/dist/images/m/150x150.jpg', //
              success: self.shareSuccess
            });
            wx.onMenuShareAppMessage({
              title: '第一反应', // 分享标题
              desc: '我在康保马拉松守护跑友的生命安全，我是第一反应人',
              link: 'http://m.firstre.cn/kangbao_show?id=' + self.mediaId + '#1', // 分享链接
              imgUrl: 'http://' + __global.base["static"] + '/dist/images/m/150x150.jpg', //
              success: self.shareSuccess
            });
          }
        });
      } else {}
    },
    uploadImg: function() {
      var self = this;
      this.module('weixin_uploadimg', function(module) {
        if (module) {
          module.chooseImage(function(info) {
            self.url = info.url;
            self.mediaId = info.mediaId;
            self.$('.placeholder').css({
              backgroundImage: 'url(' + info.url + ')'
            });
            self.check();
          });
        }
      });
    },
    showShareMask: function() {
      this.$('.screen2>.background').show();
    },
    hideShareMask: function(e) {
      this.$('.screen2>.background').hide();
      e.stopPropagation();
    },
    reupload: function() {
      //设置为auto是不合法的值，浏览器会忽略
      this.$('.placeholder').css({
        backgroundImage: 'auto'
      });
      this.$('.screen1').show();
      this.$('.screen2').hide();
    }
  });
  return View;
});