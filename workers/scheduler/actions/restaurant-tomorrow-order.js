var slogger   = require('../logger');
var db        = require('../../../db');
var notifier  = require('../../../lib/order-notifier');

require('../../../lib/order-notifications');

/**
 * Reminds restaurant of upcoming orders
 */

// Ensure orders are still valid at the time of notification
var valid = function(order) {
  return order.status === 'accepted';
};

module.exports.fn = function(job, done) {
  var logger = slogger.create('Remind Restaurant of upcoming order', {
    data: job
  });

  var orderId = job.data.orderId;

  db.orders.findOne(orderId, function(error, order) {
    if ( error ) {
      logger.error('Could not find order', error);
      return done(error);
    }
    if ( valid(order) ) {
      logger.info('Sending delivery service order submitted notification');
      return notifier.send('restaurant-tomorrow-order', orderId, done);
    }
    return done();
  });
};

module.exports.name = 'restaurant-tomorrow-order';
