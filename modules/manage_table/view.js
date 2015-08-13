define(["libs/client/views/base"], function(Base) {
  var View = Base.extend({
    moduleName: "manage_table",
    events: {
      'click .del-row': 'del',
      'click .exec-row': 'exec',
      'click input[name="select_all"]': 'selectAll',
      'click input[name="select_row"]': 'selectRow',
      'click .btn-multidel': 'delMulti'
    },
    init: function() {
      var db = this.$el.attr('data-db');
      var collection = this.$el.attr('data-collection');
      var self = this;
      var options = {};
      this.$table = this.$('table');
      try {
        options = JSON.parse(this.$el.attr('data-options'));
      } catch (e) {}
      if (this.$el.attr('data-ajax') === '1') {
        this.$table.on('dynatable:beforeProcess', function(e, data) {
          data.columns = self.$('thead th').map(function(i, th) {
            return $(th).attr('data-dynatable-column');
          });
          data.columns = _.filter(data.columns, function(col) {
            return !col.match(/^__/);
          });
          data.columns = data.columns.join(',');
          data.with_schema = '1';
        });
        this.$table.on('dynatable:ajax:success', function(e, res) {
          if (res.code === 200) {
            res.records = res.result.data[res.result.db][res.result.collection];
            res.queryRecordCount = res.result.page.total;
            var schemaData = res.result.schema;
            _.each(res.records, function(record) {
              for (var fieldName in record) {
                var value = record[fieldName];
                var fieldSchema = _.filter(schemaData.fields, function(item) {
                  return item.name === fieldName;
                })[0];
                if (fieldSchema && fieldSchema.db && fieldSchema.collection) {
                  if (typeof value === 'string') {
                    var foreignItem = _.filter(res.result._data[fieldSchema.db][fieldSchema.collection], function(item) {
                      return (item.id || item._id) === value
                    });
                    if (foreignItem[0]) {
                      value = foreignItem[0].name;
                    }
                  } else if (_.isArray(value)) {
                    value = value.map(function(oneOfValue) {
                      var foreignData = res.result._data[fieldSchema.db][fieldSchema.collection];
                      for (var i = 0; i < foreignData.length; i++) {
                        var foreignItem = foreignData[i];
                        if ((foreignItem.id || foreignItem._id) === oneOfValue) return foreignItem.name;
                      }
                    });
                  }
                }
                record[fieldName] = value;
              }
            });
          }
        });
        this.$table.dynatable({
          features: {
            recordCount: false
          },
          inputs: {
            paginationPrev: '上页',
            paginationNext: '下页'
          },
          dataset: {
            ajax: true,
            ajaxUrl: '/api/' + db + '/' + collection,
            ajaxOnLoad: true,
            records: []
          },
          writers: {
            _attributeWriter: function(record) {
              return record[this.id] || '';
            },
            _rowWriter: function(rowIndex, record, columns, cellWriter) {
              var tr = '';
              // grab the record's attribute for each column
              for (var i = 0, len = columns.length; i < len; i++) {
                if (columns[i].id === '__checkbox') {
                  tr += '<td style="text-align:center;"><input value="' + (record.id || record._id) + '" type="checkbox" name="select_row"></td>';
                } else if (columns[i].id === '__buttons' && !options.readonly) {
                  tr += '<td><a href="/crud/' + db + '/' + collection + '/update/' + (record.id || record._id) + '">编辑</a>';
                  tr += ' <a class="del-row" data-id="' + (record.id || record._id) + '" href="javascript:;">删除</a>';
                  if (options.buttons) {
                    _.each(options.buttons, function(btn) {
                      var attrs = ['data-dynatable-plugin', 'data-dynatable-plugin-data=\'' + JSON.stringify(record) + '\''];
                      var href = 'javascript:;';
                      if (btn.attrs) {
                        _.each(btn.attrs, function(val, key) {
                          if (key === 'href') {
                            href = val;
                          } else {
                            attrs.push(key + '=' + val);
                          }
                        });
                      }
                      tr += ' <a href="' + href + '" ' + attrs.join(' ') + '>' + btn.name + '</a>'
                    });
                  }
                  tr += '</td>';
                } else {
                  tr += cellWriter(columns[i], record);
                }
              }

              return '<tr>' + tr + '</tr>';
            }
          }
        });
      } else {
        this.$table.dynatable({
          features: {
            recordCount: false
          },
          inputs: {
            paginationPrev: '上页',
            paginationNext: '下页'
          }
        });
      }
      this._dt = this.$table.data('dynatable');
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
    delMulti: function(e) {
      var confirm = window.confirm('确定要批量删除么？');
      if (confirm) {
        var selected = this.$('input[name="select_row"]:checked');
        if (selected.length === 0) {
          alert('至少要选中一项');
        } else {
          var db = this.$el.attr('data-db');
          var collection = this.$el.attr('data-collection');
          var id = _.map(selected, function(row) {
            return row.value;
          });
          this.model.set({
            _id: id
          });
          this.model.db = db;
          this.model.collection = collection;
          this.model.once('sync', this.success.bind(this));
          this.model.once('error', this.success.bind(this));
          this.model.destroy();
        }
      }
    },
    selectAll: function(e) {
      var $target = $(e.target);
      this.$('input[name="select_row"]').prop('checked', $target.is(':checked'));
    },
    selectRow: function() {
      var isAll = this.$('input[name="select_row"]:checked').length === this.$('input[name="select_row"]').length;
      this.$('input[name="select_all"]').prop('checked', isAll);
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
