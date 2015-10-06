var logger = require('./logger');
var db = require('db');

module.exports = function changeStatus (job, status, done) {
  logger.info('Updating job #' + job.id + ' status to %s', status, job);

  db.scheduled_jobs.update(
    { status: 'in-progress', id: job.id }
  , { status: status }
  , { returning: ['*'] }
  , function( error, jobs ) {
      if ( error ) logger.error('Unable to change status', error);

      // don't pass error to done
      // otherwise the async.each will terminate prematurely
      done();
    }
  );
};
