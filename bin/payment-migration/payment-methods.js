var db = require('../../db');
var logger = require('./logger').create('User Setup');
var utils = require('../../utils');
var config = require('../../config');
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
, one: [{ table: 'users', alias: 'user' }]
, columns: [ { expression: '*' } ]
};

db.users_payment_methods.find($query, $options, function(err, pms) {
  if ( err ) return logger.error('Unable to find user payment methods', err);
  if ( !pms.length ) {
    logger.info('No remaining payment methods to migrate');
    process.exit();
  }

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
// 2. db update payment_method
// todo waterfall
function migratePaymentMethod(pm, callback) {
  var pm_uri = pm.uri.split('/');
  pm_uri = pm_uri[pm_uri.length - 1];

  utils.request({
    url: 'https://api.balancedpayments.com/cards/' + pm_uri
  , headers: { Accept: 'application/vnd.api+json;revision=1.1' }
  , auth: { user: config.balanced.secret }
  }, function(err, response, body) {
    if ( err ) {
      logger.error('Unable to get balanced card ' + pm.uri);
      return callback(err);
    }

    try {
      body = JSON.parse(body);
    } catch(e) {
      return callback(e);
    }

    var card = body['cards'][0];

    if ( !card.meta['stripe_customer.funding_instrument.id'] ) {
      logger.error('Unable to associate stripe metadata ', err);
      return callback( new Error('Unable to associate stripe metadata') );
    }

    utils.stripe.customers.retrieveCard(
      pm.user.stripe_id
    , card.meta['stripe_customer.funding_instrument.id']
    , function(err, stripeCard) {
        if ( err ) {
          logger.error('Unable to get stripe card');
          return callback(new Error('Unable to get stripe card'));
        }
        logger.info('Payment Method #' + pm.payment_method_id + ' - Stripe ID ' + stripeCard.id);
        db.payment_methods.update(
          { id: pm.payment_method_id }
        , { stripe_id: stripeCard.id
          , data: stripeCard }
        , { returning: ['*'] }
        , callback
        );
      }
    );
  });
};
