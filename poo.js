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

scheduler.on('make-call', function(job) {
  console.log(job.data);


  scheduler.changeJobStatus('failed', job, function() {console.log(arguments);});
});

scheduler.run('make-call');
//
// scheduler.queue('make-call', new Date(), { to: '7135178077',
//      from: '5122706333',
//      url: 'http://localhost:3000/orders/851/voice',
//      ifMachine: 'Continue',
//      method: 'GET' }, function() {
//        console.log(arguments);
//      });
