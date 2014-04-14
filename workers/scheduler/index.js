// Register actions
var actions = require('./actions');
var reporter = require('../../lib/stats-reporter');
var scheduler = require('../../lib/scheduler');

scheduler.runAll( function( errors, stats ){
  reporter.logResults( errors, stats );
  process.exit(0);
});
