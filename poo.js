// var scheduler = require('./scheduler');
//
//
// var date = new Date();
// date.setMinutes(date.getMinutes() + 2);
// scheduler.queue('make-call', date, {
//   to: 'aa7135178077',
//   from: 'a5122706555',
//   url: 'https://www.goodybag.com/orders/1066/voice',
//   ifMachine: 'Continue',
//   method: 'GET'
// }, function() {
//   console.log(arguments);
// });


var Scheduler = require('./lib/scheduler');
var scheduler = new Scheduler();

scheduler.on('email', function(job) {
  console.log(job.data);

  scheduler.changeJobStatus('failed', job, function() {console.log(arguments);});
});
//
// scheduler.queue('email', new Date(), { to: 'hop', from: 'doddy'}, function(err, result) {
//   console.log(arguments);
// });


scheduler.run('email');
