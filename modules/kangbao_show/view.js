define(["libs/client/views/base", "libs/client/jquery.scrollify", "libs/client/sha1"], function(Base) {
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
      self.initScroll();
      self.getTicket();
    },
    createNonceStr: function() {
      return Math.random().toString(36).substr(2, 15);
    },
    createTimestamp: function() {
      return parseInt(new Date().getTime() / 1000) + '';
    },
    raw: function(args) {
      var keys = Object.keys(args);
      keys = keys.sort()
      var newArgs = {};
      keys.forEach(function(key) {
        newArgs[key.toLowerCase()] = args[key];
      });

      var string = '';
      for (var k in newArgs) {
        string += '&' + k + '=' + newArgs[k];
      }
      string = string.substr(1);
      return string;
    },
    getTicket: function() {
      var self = this;
      var now = this.createTimestamp();
      var nonceStr = this.createNonceStr();
      $.ajax({
        url: 'http://api.firstre.cn/weixin/ticket',
        // url:'http://dev.api.tvall.com:8999/video/ticket',
        success: function(data) {
          var ticket = data.result.ticket;
          var ret = {
            jsapi_ticket: ticket,
            nonceStr: nonceStr,
            timestamp: now,
            url: location.href.replace(/#.*$/, '')
          };
          var string = self.raw(ret);
          var sign = shalUtil.hex_sha1(string);
          wx.config({
            debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
            appId: 'wx8cfeb90d2826a007', // 必填，公众号的唯一标识
            timestamp: now, // 必填，生成签名的时间戳
            nonceStr: nonceStr, // 必填，生成签名的随机串
            signature: sign, // 必填，签名，见附录1
            jsApiList: [
                'checkJsApi',
                'onMenuShareTimeline',
                'onMenuShareAppMessage',
                'onMenuShareQQ',
                'onMenuShareWeibo',
                'hideMenuItems',
                'showMenuItems',
                'hideAllNonBaseMenuItem',
                'showAllNonBaseMenuItem',
                'translateVoice',
                'startRecord',
                'stopRecord',
                'onRecordEnd',
                'playVoice',
                'pauseVoice',
                'stopVoice',
                'uploadVoice',
                'downloadVoice',
                'chooseImage',
                'previewImage',
                'uploadImage',
                'downloadImage',
                'getNetworkType',
                'openLocation',
                'getLocation',
                'hideOptionMenu',
                'showOptionMenu',
                'closeWindow',
                'scanQRCode',
                'chooseWXPay',
                'openProductSpecificView',
                'addCard',
                'chooseCard',
                'openCard'
              ] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
          });
          wx.ready(function() {
            wx.onMenuShareTimeline({
              title: '我在康保马拉松守护跑友的生命安全，我是第一反应人', // 分享标题
              link: location.href, // 分享链接
              imgUrl: 'http://' + __global.base["static"] + '/dist/images/m/150x150.jpg', //
              success: self.shareSuccess
            });
            wx.onMenuShareAppMessage({
              title: '第一反应', // 分享标题
              desc: '我在康保马拉松守护跑友的生命安全，我是第一反应人',
              link: location.href, // 分享链接
              imgUrl: 'http://' + __global.base["static"] + '/dist/images/m/150x150.jpg', //
              success: self.shareSuccess
            });
          });
        }
      });
    },
    shareSuccess: function() {
      alert('分享成功');
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