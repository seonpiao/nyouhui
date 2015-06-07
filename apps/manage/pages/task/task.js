require('seajs');
var Flow = require('flow-js');
var path = require('path');

var stepId = process.argv[2];
var params = JSON.parse(process.argv[3] || '{}');
var input = JSON.parse(process.argv[4] || '{}');

var flow = new Flow();

var step = require(path.join(__dirname, 'steps', stepId + '.js'));

step.params = params;

console.log(input)

flow.addStep(stepId, step);

flow.begin(input);

flow.go(stepId);

flow.on('end', function() {
  process.exit(0);
});

setInterval(function() {

}, 1000)