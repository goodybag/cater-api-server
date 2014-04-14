// Register actions
var actions = require('./actions');
var reporter = require('../../lib/stats-reporter');
var scheduler = require('../../lib/scheduler');
/*
scheduler.run2('make-call', function(error, stats){
  console.log(error);
  console.log(stats);
});

scheduler.run2('send-sms', function(error, stats) {
  console.log(error);
  console.log(stats);
});
*/
scheduler.runAll();
// scheduler.runAll('make-call', function())

