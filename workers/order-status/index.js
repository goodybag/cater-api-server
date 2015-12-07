var Worker  = require('@goodybag/order-status-worker');
var config  = require('../../config');
var logger  = require('../../lib/logger').create('Worker-Order-Status');

var done = function (error) {
  if (error) {
    logger.error('Error updating order statuses', {
      error: error
    });

    return process.exit(1);
  }

  return process.exit(0);
}

var worker = new Worker(config.postgresConnStr);
worker.start(done);
