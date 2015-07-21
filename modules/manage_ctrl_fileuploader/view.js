define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_fileuploader",
    init: function() {
      // Initialize the jQuery File Upload widget:
      $('#fileupload').fileupload({
        // Uncomment the following to send cross-domain cookies:
        //xhrFields: {withCredentials: true},
        url: '/api/upload',
        getFilesFromResponse: function(data) {
          data = data.result;
          if (data.code === 200) {
            data.result.thumbnailUrl = data.result.url;
            return [data.result];
          }
        }
      });
    },
    name: function() {
      return '';
    },
    value: function() {
      return '';
    }
  });
  return View;
});
