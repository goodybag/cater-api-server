var scheduler = require('../scheduler');

// Run all pending `test` jobs
var consume = function(data, done) {
  console.log('Consuming: ' + JSON.stringify(data));
  // SEND EMAIL

  // CONTINUE TO NEXT JOB
  done();
}

var done = function(error, results) {
  if (error) return console.log ('couldnt finish test job ' + error);
  console.log('Completed ' + results.length + ' "test" jobs');
}

// work(action, workerFn, callback)
scheduler.work('test', consume, done);
