define(["libs/client/views/base"], function(Base) {
	var View = Base.extend({
		moduleName: "manage_ctrl_checkboxselect",
		value: function() {
			return this.$('input')[0].checked ? '1' : '0';
		},
		name: function() {
			return this.$('input').attr('name');
		}
	});
	return View;
});