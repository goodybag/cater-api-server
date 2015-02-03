/**
 * Scheduler Config
 */

module.exports = {
  cron: '*/10 * * * * *'
, start: true
, limit: 2 // max # of parallel jobs
, workers: 1 // # of workers spawned per process
};
