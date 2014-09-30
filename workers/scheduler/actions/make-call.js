var config  = require('../../../config');
var slogger = require('../logger');
var notifier = require('../../../lib/order-notifier');

module.exports = function(job, done) {
  var logger = slogger.create('MakeCall', {
    data: job
  });

  logger.info('Making call');
  notifier.send('restaurant-order-submitted-voice', job.data.order_id, done);
};
