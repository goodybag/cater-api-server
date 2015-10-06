/**
 * Scheduler Config
 */

module.exports = {
  cron: '*/10 * * * * *'  // poll db every 10 secs
, start: true             // enable/disable scheduler
, limit: 4                // max # of parallel jobs
, workers: 2              // # of workers spawned per process
};
