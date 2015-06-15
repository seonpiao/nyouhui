define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_table",
    events: {
      'click .del-row': 'del',
      'click .exec-row': 'exec'
    },
    init: function() {
      var db = this.$el.attr('data-db');
      var collection = this.$el.attr('data-collection');
      var self = this;
      var params = {
        "bPaginate": true,
        "bLengthChange": false,
        "bFilter": true,
        "bSort": true,
        "bInfo": false,
        "bAutoWidth": false
      };
      var isAjax = this.$el.attr('data-ajax') === '1';
      if (isAjax) {
        _.extend(params, {
          "bServerSide": true,
          "sAjaxSource": "/dt/" + db + '/' + collection,
          "fnServerParams": function(aoData) {
            var sColumns = self.getUrlParam('sColumns');
            var sSearch = self.getUrlParam('sSearch');
            var oDisplayStart, oDisplayLength;
            var caredParams = {
              'sColumns': 'scol',
              'sSearch': 'skey'
            };
            var serverParams = {};
            _.forEach(aoData, function(item) {
              serverParams[item.name] = item;
              if (item.name === 'iDisplayStart') {
                oDisplayStart = item;
              } else if (item.name === 'iDisplayLength') {
                oDisplayLength = item;
              }
              if (item.name === 'sColumns') {
                item.value = _.map(_.filter(self.$('th'), function(el) {
                  return !!$(el).attr('data-field');
                }), function(el) {
                  return $(el).attr('data-field');
                }).join(',');
              }
            });
            if (!self._initPage) {
              var page = self.getUrlParam('page');
              oDisplayStart.value = (page - 1) * oDisplayLength.value;
              _.forEach(caredParams, function(value, key) {

              });
              self._initPage = true;
            } else {

            }
          },
          "fnAjaxUpdateDraw": function(oSettings, json) {
            var options = JSON.parse(self.$el.attr('data-options'));
            if (json.result.sEcho !== undefined) {
              /* Protect against old returns over-writing a new one. Possible when you get
               * very fast interaction, and later queries are completed much faster
               */
              if (json.result.sEcho * 1 < oSettings.iDraw) {
                return;
              } else {
                oSettings.iDraw = json.result.sEcho * 1;
              }
            }
            self.loadTemplate('body', function(template) {

              if (!oSettings.oScroll.bInfinite ||
                (oSettings.oScroll.bInfinite && (oSettings.bSorted || oSettings.bFiltered))) {
                dt.oApi._fnClearTable(oSettings);
              }
              oSettings._iRecordsTotal = parseInt(json.result.page.total, 10);
              oSettings._iRecordsDisplay = parseInt(json.result.page.total, 10);

              _.extend(json, {
                options: options
              });
              var html = template(json);
              self.$('tbody').html(html);

              dt.oApi._fnProcessingDisplay(oSettings, false);
              dt.fnPagingInfo = function(oSettings) {
                var pageInfo = {
                  "iStart": json.result.page.pagesize * (json.result.page.page - 1),
                  "iEnd": json.result.page.pagesize * (json.result.page.page - 1) + json.result.page.ret,
                  "iLength": json.result.page.pagesize * 1,
                  "iTotal": json.result.page.total,
                  "iFilteredTotal": json.result.page.total,
                  "iPage": json.result.page.page - 1,
                  "iTotalPages": Math.ceil(json.result.page.total / json.result.page.pagesize)
                };
                return pageInfo;
              };
              dt.oApi._fnCallbackFire(oSettings, 'aoDrawCallback', 'pagination', [oSettings]);
              self.addUrlParam({
                page: json.result.page.page
              });
            });
          }
        });
      }
      var dt = this.$el.dataTable(params);
    },
    addUrlParam: function(params) {
      var replacedUrl = location.href;
      _.forEach(params, function(value, name) {
        var exp = new RegExp('(\\?|&)' + name + '=[^&]+');
        if (!replacedUrl.match(exp)) {
          if (replacedUrl.indexOf('?') === -1) {
            replacedUrl = replacedUrl.replace(/(#|$)/, "?" + name + "=" + value + "$1");
          } else {
            replacedUrl = replacedUrl.replace(/(#|$)/, "&" + name + "=" + value + "$1");
          }
        } else {
          replacedUrl = replacedUrl.replace(exp, '$1' + name + '=' + value);
        }
      });
      history.replaceState(null, null, replacedUrl);
    },
    getUrlParam: function(name) {
      var exp = new RegExp('(?:\\?|&)' + name + '=([^&]+)');
      var value = location.href.match(exp);
      if (value) {
        return value[1];
      }
      return '';
    },
    del: function(e) {
      var confirm = window.confirm('确定要删除么？');
      if (confirm) {
        var $target = $(e.currentTarget);
        var id = $target.attr('data-id');
        var db = this.$el.attr('data-db');
        var collection = this.$el.attr('data-collection');
        this.model.set({
          _id: id
        });
        this.model.db = db;
        this.model.collection = collection;
        this.model.once('sync', this.success.bind(this));
        this.model.once('error', this.success.bind(this));
        this.model.destroy();
      }
    },
    exec: function(e) {
      var $target = $(e.currentTarget);
      var id = $target.attr('data-id');
      this.model.exec(id, function(err) {
        if (err) {
          alert(err.message);
        }
      });
    },
    success: function(model, resp, options) {
      if (resp.code === 200) {
        alert('操作成功');
        location.reload();
      } else {
        alert(resp.message || '操作失败');
      }
    },
    error: function(model, resp, options) {
      alert('操作失败');
    }
  });
  return View;
});