// Register actions
var actions = require('./actions');
var reporter = require('../../lib/stats-reporter');
var scheduler = require('../../lib/scheduler');
var CronJob = require('cron').CronJob;
var config = require('../../config');
var utils = require('../../utils');

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

new CronJob(config.scheduler.cron, function tick(){
  if ( scheduler.q.running() < config.scheduler.limit ) {
    scheduler.runAll( { limit: config.scheduler.limit }, logStats );
  }
}, null, config.scheduler.start);
