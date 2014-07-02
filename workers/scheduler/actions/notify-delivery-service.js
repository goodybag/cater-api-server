var config    = require('../../../config');
var utils     = require('../../../utils');
var logger    = require('../../../logger').scheduler;
var db        = require('../../../db');
var notifier  = require('../../../lib/order-notifier');

require('../../../lib/order-notifications');

module.exports = function(job, done) {
  var orderId = job.data.orderId;

  utils.parallel([
    notifier.send.bind( notifier, 'delivery-service-order-accepted', orderId )
    // TODO: remove GB notification after delivery service is stable
  , notifier.send.bind( notifier, 'goodybaggers-asap-order', orderId )
  ], done );
};
