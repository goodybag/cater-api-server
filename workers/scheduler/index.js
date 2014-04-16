// Register actions
var actions = require('./actions');
var reporter = require('../../lib/stats-reporter');
var scheduler = require('../../lib/scheduler');
var CronJob = require('cron').CronJob;
var config = require('../../config');

new CronJob(config.scheduler.cron, function(){
  scheduler.runAll( function( errors, stats ){
    reporter.logResults( errors, stats );
  });    
}, null, config.scheduler.start);
