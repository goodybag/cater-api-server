var actions = require('./actions');
var reporter = require('../stats-reporter');

module.exports = function createStats(job, status, callback) {
  var stats = Object.keys(actions).reduce(function(memo, action) {
    memo[action] = reporter.createStatsGroup({
        started:     'Jobs Started'
      , completed:   'Jobs Completed'
      , failed:      'Jobs Failed'
    });
    return memo;
  }, {});

  stats.other = reporter.createStatsGroup({
    unregistered:    'Jobs with unregistered action'
  });

  return stats;
};
