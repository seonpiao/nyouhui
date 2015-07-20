define([ "libs/client/views/base" ], function(Base) {
  var View = Base.extend({
    moduleName: "manage_ctrl_control1",
    name:function(){
    	return this.$('input').val();
    },
    value:function(){
    	return this.$('input').attr('name');
    }
  });
  return View;
});