/**
* User Order Payment Failed
*
* Description:
*    Checks for orders with payment_status = 'failed'
*     sends user a reminder email
*/

var config  = require('../../config');
var db      = require('../../db');
var logger  = require('../../lib/logger').create('Worker-Popularity');
var utils   = require('../../utils');
var scheduler = require('../../lib/scheduler');


function processOrder(order, done) {
  scheduler.enqueue('send-order-notifications', new Date(), {
    notification_id: 'user-order-payment-failed'
  , order_id: order.id
  }, done); 
}

function worker() {
  logger.info('Scheduling declined cc notiications');
  
  utils.async.waterfall(
  [
    function (next) {
      db.orders.find({
        payment_status: 'error'
      , datetime: { $gte: config.paymentFailedStartDate }
      }, next);
    }

  , function (orders, next) {

    var jobData = {
      notification_id: 'user-order-payment-failed'
    , order_id: orders[0].id
    };

    var limit = 5;
    utils.async.eachLimit(orders, limit, processOrder, next);
  }
  ], function (error) {
    if (error) {
      logger.error('Error scheduling declined cc notiications', {
        error: error
      });
    };
  });
}

setInterval(worker, config.workers.payment.declined.interval);
