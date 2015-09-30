// Register actions
var actions = require('./actions');
var reporter = require('../../lib/stats-reporter');
var scheduler = require('../../lib/scheduler');
var CronJob = require('cron').CronJob;
var config = require('../../config');
var utils = require('../../utils');
var cluster = require('cluster');
var logger = require('./logger');
var domain = require('domain');

if (!cluster.isMaster) {
  startWorker();
} else {
  logger.error('Cannot process jobs on master');
}

function startWorker () {

  var cronJob = new CronJob({
    cronTime: config.scheduler.cron
  , onTick: function tick () {
      if ( scheduler.q.running() < config.scheduler.limit ) {
        scheduler.runAll( { limit: config.scheduler.limit }, logStats );
      }
    }
  , start: false
  });

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

  var d = domain.create();

  d.on('error', function (error) {
    logger.error('Uncaught Exception', err);

    try {

      // stop enqueueing jobs
      cronJob.stop();
      scheduler.q.drain = function () {
        process.exit(1);
      };

      // wait 30 seconds for the queue to drain
      var killtimer = setTimeout(function () {
          process.exit(1);
      }, 30*1000);

      killtimer.unref();
      cluster.worker.disconnect();

    } catch (err) {
      logger.error('Unable to kill process', err);
    }

  });

  d.run(function () {
    process.nextTick(function () {
      if (config.scheduler.start) {
        cronJob.start();
      }
    });
  });

}
