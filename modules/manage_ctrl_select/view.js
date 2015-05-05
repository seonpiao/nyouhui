define(["libs/client/views/base"], function(Base) {
	var View = Base.extend({
		moduleName: "manage_ctrl_select",
		init: function() {
			this.listenTo(this.model, 'sync', this.initSelect, this);
			this.on('afterrender', this.selected.bind(this));
			this.model.db = (this.$el.attr('data-db'));
			var list = this.$el.attr('data-list');
			var collection = (this.$el.attr('data-collection'))
			this.model.collection = list ? list + '_' + this.$el.attr('data-name') : collection;
			var params = {};
			var order = this.$el.attr('data-order');
			if (order) {
				params.sort = order;
			}
			if (collection) {
				this.model.fetch({
					data: params
				});
			}
		},
		value: function() {
			return [this.$('select').val(), this.$('select').find('option:selected').text()];
		},
		name: function() {
			return [this.$('select').attr('name'), this.$('select').attr('name') + '_zn'];
		},
		initSelect: function() {
			this.renderTo(this.$('select'));
		},
		selected: function() {
			var value = this.$('select').attr('data-result');
			var index = this.model.toJSON().results.map(function(v) {
				return v._id
			}).indexOf(value);
			if (index == -1) {
				index = 0;
			}
			this.$('select')[0].selectedIndex = index;
		}
	});
	return View;
});