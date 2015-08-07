var Email = require('email').Email;
var co = require('co');
var moment = require('moment');
var thunkify = require('thunkify');

module.exports = {
  input: ['staffs'],
  output: [],
  go: function(data, done) {
    co(function*() {
      var staffs = data.staffs;
      for (var i = 0; i < staffs.length; i++) {
        var staff = staffs[i];
        staff.salary = staff.salary * 1;
        staff.reward = staff.reward * 1;
        staff.insurance = staff.insurance * 1;
        staff.fund = staff.fund * 1;
        var month = moment().format('YYYY年MM月');
        var msg = new Email({
          from: "hr@bylh.tv",
          to: staff.email,
          subject: "【" + staff.name + "同学】" + month + "工资条",
          bodyType: 'html',
          body: '<p>' + staff.name + ' 您好，</p>' +
            '<p>感谢您本月的辛勤工作，以下是您' + month + '工资单明细，请查收。</p>' +
            '<p>如有问题请回复邮件咨询</p>' +
            '<table style="width:100%;border-collapse: collapse;" cellspacing="0">' +
            '<thead>' +
            '<tr>' +
            '<th style="padding:5px; border: 1px solid black;color: white; background:#666;">姓名</th>' +
            '<th style="padding:5px; border: 1px solid black;color: white; background:#666;">基本工资</th>' +
            '<th style="padding:5px; border: 1px solid black;color: white; background:#666;">社保扣减</th>' +
            '<th style="padding:5px; border: 1px solid black;color: white; background:#666;">公积金扣减</th>' +
            '<th style="padding:5px; border: 1px solid black;color: white; background:#666;">绩效</th>' +
            '<th style="padding:5px; border: 1px solid black;color: white; background:#666;">应纳税总额</th>' +
            '<th style="padding:5px; border: 1px solid black;color: white; background:#666;">个人所得税</th>' +
            '<th style="padding:5px; border: 1px solid black;color: white; background:#666;">实发</th>' +
            '</tr>' +
            '</thead>' +
            '<tbody>' +
            '<tr>' +
            '<td style="padding:5px; border: 1px solid;text-align:left">' + staff.name + '</td>' +
            '<td style="padding:5px; border: 1px solid;text-align:right">' + (staff.salary).toFixed(2) + '</td>' +
            '<td style="padding:5px; border: 1px solid;text-align:right">' + ((staff.salary + staff.reward) * staff.insurance).toFixed(2) + '</td>' +
            '<td style="padding:5px; border: 1px solid;text-align:right">' + ((staff.salary + staff.reward) * staff.fund).toFixed(2) + '</td>' +
            '<td style="padding:5px; border: 1px solid;text-align:right">' + staff.reward.toFixed(2) + '</td>' +
            '<td style="padding:5px; border: 1px solid;text-align:right">' + ((staff.salary + staff.reward) * (1 - staff.insurance - staff.fund)).toFixed(2) + '</td>' +
            '<td style="padding:5px; border: 1px solid;text-align:right">' + (((staff.salary + staff.reward) * (1 - staff.insurance - staff.fund)) * 0.2).toFixed(2) + '</td>' +
            '<td style="padding:5px; border: 1px solid;text-align:right">' + (staff.salary + staff.reward - ((staff.salary + staff.reward) * (1 - staff.insurance - staff.fund)) * 0.2).toFixed(
              2) +
            '</td>' +
            '</tr>' +
            '</tbody>' +
            '</table>' +
            '<p>谢谢</p>' +
            '<p>人力资源部</p>'
        });
        yield thunkify(msg.send.bind(msg))();
      }
    })(done);
  }
};
