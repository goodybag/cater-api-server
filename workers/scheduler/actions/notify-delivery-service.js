var config    = require('../../../config');
var logger    = require('../../../logger').scheduler;
var db        = require('../../../db');
var notifier  = require('../../../lib/order-notifier');

require('../../../lib/order-notifications');

module.exports = function(job, done) {
  var orderId = job.data.orderId;
  notifier.send( 'delivery-service-order-accepted', orderId );

  // TODO: remove GB notification after delivery service is stable
  notifier.send( 'goodybaggers-asap-order', orderId );
  done(error);
};
