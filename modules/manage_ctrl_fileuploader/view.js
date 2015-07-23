define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_fileuploader",
    init: function() {
      var self = this;
      this.max = (this.$el.attr('data-max') || Infinity) * 1;
      this.$fileupload = this.$('.fileupload');
      // Initialize the jQuery File Upload widget:
      this.$fileupload.fileupload({
        // Uncomment the following to send cross-domain cookies:
        //xhrFields: {withCredentials: true},
        url: '/api/upload?dir=manage',
        maxNumberOfFiles: this.max,
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
      return this.$el.attr('data-name');
    },
    value: function() {
      if (this.max === 1) {
        return this.$('.file-url').attr('href');
      } else {
        return _.map(this.$('.file-url'), function(el) {
          return $(el).attr('href');
        });
      }
    }
  });
  return View;
});
