var logger = require('./logger');
var forky = require('forky');
var config = require('../../config');

try {
  forky({ path: __dirname + '/worker.js', workers: config.scheduler.workers });
} catch ( e ) {
  logger.error('Unable to spawn scheduler workers', e);
}

process.on('uncaughtException', function(err) {
  logger.error('Uncaught Exception', err);
  forky.disconnect();
});
