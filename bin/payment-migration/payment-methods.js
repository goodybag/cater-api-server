var db = require('db');
var logger = require('./logger').create('User Setup');
var utils = require('utils');
var concurrency = 5;

logger.info('Mapping balanced uri to stripe ids');

var $query = {

};

var $options = {
  // join payment_methods
  // payment_methods.stripe = $null
};

db.users_payment_methods.find($query, function(err, pms) {
  if ( err ) return logger.error('Unable to find user payment methods', err);
  if ( !pms.length ) return logger.info('No remaining payment methods to migrate');

  q.push(pms, function completed(err, paymentMethod) {
    if (err) return logger.error('Unable to migrate payment method', err);
  });
});

var q = utils.async.queue(migratePaymentMethod, concurrency);

q.drain = function drained() {
  logger.info('Migration Queue Drained');
  process.exit();
}

// 1. look up balanced payment method
// 2. db update payment_method with balanced customer metadata stripe_customer.funding_instrument.id
function migratePaymentMethod(user, callback) {
  // utils.balanced.Customers.get(user.balanced_customer_uri, function(err, customer){
  //   if ( err )
  //     return logger.error('Unable to get balanced customer ' + user.balanced_customer_uri, err);
  //
  //   if ( !customer.meta['stripe.customer_id'] )
  //     return logger.error('Unable to associate stripe metadata', err);
  //
  //   db.users.update({ id: user.id }, { stripe_id: customer.meta['stripe.customer_id'] }, { returning: ['*'] }, function(err) {
  //     logger.info('User #' + user.id  + ' Balanced URI: ' + user.balanced_customer_uri + ' -> Stripe: ' + customer.meta['stripe.customer_id']);
  //     callback(err, user);
  //   });
  // });
  callback(null);
};
