define(["libs/client/views/base", "libs/client/sha1"], function(Base) {
  var View = Base.extend({
    moduleName: "weixin_uploadimg",
    init: function() {
      this.getTicket();
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
        }
      });
    },
    chooseImage: function(callback) {
      var self = this;
      wx.chooseImage({
        success: function(res) {
          var localIds = res.localIds; // 返回选定照片的本地ID列表，localId可以作为img标签的src属性显示图片
          wx.uploadImage({
            localId: localIds[0], // 需要上传的图片的本地ID，由chooseImage接口获得
            isShowProgressTips: 1, // 默认为1，显示进度提示
            success: function(res) {
              var serverId = res.serverId; // 返回图片的服务器端ID
              $.ajax({
                url: 'http://api.firstre.cn/weixin/downmedia?media_id=' + serverId,
                dataType: 'json',
                success: function(json) {
                  if (json.code === 0) {
                    callback({
                      mediaId: serverId,
                      url: json.result.url
                    });
                  }
                }
              })
            }
          });
        }
      });
    }
  });
  return View;
});