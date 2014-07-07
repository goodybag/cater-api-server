var config    = require('../../../config');
var logger    = require('../../../logger').scheduler;
var db        = require('../../../db');
var notifier  = require('../../../lib/order-notifier');

module.exports = function(job, done) {
  var data = job.data;
  db.orders.findOne(data.orderId, function( err, order ){
    if ( err ) return done( err );
    if ( !order.ds_token_used ) {
      notifier.send('gb-delivery-service-action-needed', order)
    }
    done(null);
  });
};
