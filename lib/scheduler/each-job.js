var q = require('./q');

/**
 * Exports a function that pushes jobs onto the async.queue
 */

module.exports = function eachJob(stats) {
  return function(job, done) {
    q.push({ job: job, stats: stats, done: done });
  };
};
