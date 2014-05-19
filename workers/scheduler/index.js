// Register actions
var actions = require('./actions');
var reporter = require('../../lib/stats-reporter');
var scheduler = require('../../lib/scheduler');
var CronJob = require('cron').CronJob;
var config = require('../../config');
var utils = require('../../utils');

var reduceJobTriggered = function(memo, data) {
  return memo || data.value;
}

var reduceActions = function(memo, group, action) {
  var jobTriggered = utils.reduce(group, reduceJobTriggered, false);
  if ( jobTriggered ) memo[action] = group;
  return memo;
}

new CronJob(config.scheduler.cron, function(){
  scheduler.runAll( function( errors, stats ){
    // Filter actions that had some activity
    stats = utils.reduce(stats, reduceActions, {});
    if ( errors || !utils.isEmpty(stats) ) reporter.logResults( errors, stats );
  });
}, null, config.scheduler.start);
