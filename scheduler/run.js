var scheduler = require('../scheduler');

// Run all pending `test` jobs
scheduler.work('test', function(data) {
  console.log(data);
});
