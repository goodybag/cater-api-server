var config    = require('../../../config');
var db        = require('../../../db');
var notifier  = require('../../../lib/order-notifier');
var slogger   = require('../logger');

/**
 * Send GB admins a notification if a delivery service is sitting on
 * a delivery email
 */
module.exports.fn = function(job, done) {
  var logger = slogger.create('DeliveryServiceOrder', {
    data: job
  });
  var data = job.data;

  logger.info('Checking if we need to send notification');

  db.orders.findOne(data.orderId, function( err, order ){
    if ( err ) return done( err );
    if ( !order.ds_token_used ){
      logger.info('Token not used, sending notification', {
        order: order
      });
      notifier.send('goodybaggers-ds-order-needs-attention', order);
    }
    done(null);
  });
};

module.exports.name = 'delivery-service-order';
