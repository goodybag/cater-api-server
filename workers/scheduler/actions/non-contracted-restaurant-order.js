var config    = require('../../../config');
var utils     = require('../../../utils');
var slogger   = require('../logger');
var db        = require('../../../db');
var notifier  = require('../../../lib/order-notifier');

require('../../../lib/order-notifications');

module.exports.fn = function(job, done) {
  var logger = slogger.create('Notify CS of non-contracted restaurant order', {
    data: job
  });

  var orderId = job.data.orderId;

  logger.info('Sending CS sms and email notifications');

  utils.async.parallel([
    notifier.send.bind( notifier, 'gb-non-contracted-order-email', orderId )
  // , notifier.send.bind( notifier, 'gb-non-contracted-order-sms', orderId )
  ], done );
};

module.exports.name = 'non-contracted-restaurant-order';
