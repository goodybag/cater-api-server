var config    = require('../../../config');
var utils     = require('../../../utils');
var slogger   = require('../logger');
var db        = require('../../../db');
var notifier  = require('../../../lib/order-notifier');
var notifier2 = require('../../../lib/order-notifications2');

require('../../../lib/order-notifications');

module.exports.fn = function(job, done) {
  var logger = slogger.create('Notify Delivery Service', {
    data: job
  });

  job.options = job.options || {};

  var orderId = job.data.order_id;

  logger.info('Sending delivery service order submitted notification');

  var options = {
    one: [{ table: 'delivery_services', alias: 'delivery_service' }]
  };

  db.orders.findOne( orderId, options, function( error, order ){
    if ( error ) return done( error );

    var dsnid = order.delivery_service.order_submitted_notification_id;

    if ( dsnid in notifier2.get() ){
      return notifier2
        .get( dsnid )
        .create( order.id, job.data.user_id, job.options )
        .send( function( error, result ){
          if ( error ){
            return done( error );
          }

          if ( dsnid !== 'dropoff-order-submitted' ){
            return done( null, result );
          }

          // Dropoff Order Submitted should also update the
          // order's courier_tracking_id
          db.orders.update( orderId, { courier_tracking_id: result.data.url }, done );
        });
    }

    var nid = dsnid in notifier.defs ? dsnid : 'delivery-service-order-submitted';

    notifier.send( nid, orderId, job.options, done );
  });
};

module.exports.name = 'notify-delivery-service';
