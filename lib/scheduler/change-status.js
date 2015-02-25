var logger = require('./logger');

module.exports = function changeStatus(tx) {
  return function(job, status, done) {
    logger.info('Updating job #' + job.id + ' status to %s', status, job);

    tx.scheduled_jobs.update(
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
};
