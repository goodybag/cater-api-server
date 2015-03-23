var db = require('db');
var logger = require('./logger').create('User Setup');
var utils = require('utils');
var concurrency = 5;

logger.info('Mapping balanced uri to stripe ids');

var $query = {
  $null: { 'payment_methods.stripe_id': true }
};

var $options = {
  joins: [
    { type: 'left'
    , target: 'payment_methods'
    , on: { id: '$users_payment_methods.payment_method_id$'}
    }
  ]
, columns: [ { expression: '*' } ]
};

db.users_payment_methods.find($query, $options, function(err, pms) {
  if ( err ) return logger.error('Unable to find user payment methods', err);
  if ( !pms.length ) return logger.info('No remaining payment methods to migrate');

  logger.info(pms.length + ' cards to update..');
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
function migratePaymentMethod(pm, callback) {
  utils.balanced.Cards.get(pm.uri, function(err, card) {
    if ( err )
      return logger.error('Unable to get balanced card ' + pm.uri, err);

    if ( !card.meta['stripe_customer.funding_instrument.id'] )
      return logger.error('Unable to associate stripe metadata ', err);

    db.payment_methods.update(
      { id: pm.payment_method_id }
    , { stripe_id: card.meta['stripe_customer.funding_instrument.id'] }
    , { returning: ['*'] }
    , callback
    );
  });
};
