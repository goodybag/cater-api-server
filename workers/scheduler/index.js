// Register actions
var actions = require('./actions');
var reporter = require('../../lib/stats-reporter');
var scheduler = require('../../lib/scheduler');
var CronJob = require('cron').CronJob;
var config = require('../../config');
var utils = require('../../utils');

// Ensure scheduler actions and scheduler module share
// the same base logging instance
scheduler.provideLogger( require('./logger') );

var reduceJobTriggered = function(memo, data) {
  return memo || data.value;
};

var reduceActions = function(memo, group, action) {
  var jobTriggered = utils.reduce(group, reduceJobTriggered, false);
  if ( jobTriggered ) memo[action] = group;
  return memo;
};

var logStats = function( errors, stats ){
  // Filter actions that had some activity
  stats = utils.reduce(stats, reduceActions, {});
  if ( errors || !utils.isEmpty(stats) ) reporter.logResults( errors, stats );
};

var opts = { limit: config.scheduler.limit };

new CronJob(config.scheduler.cron, function tick(){
  scheduler.runAll( opts, logStats );
}, null, config.scheduler.start);
