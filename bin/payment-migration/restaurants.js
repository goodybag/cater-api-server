var db = require('../../db');
var logger = require('./logger').create('User Setup');
var utils = require('../../utils');
var concurrency = 5;
var balanced = utils.balanced;

logger.info('Mapping balanced uri to stripe ids');

var $query = {
  balanced_customer_uri: { $notNull: true }
, stripe_id: { $null: true }
};

db.restaurants.find($query, function(err, restaurants) {
  if ( err ) return logger.error('Unable to find restaurants', err);
  if ( !restaurants.length ) {
    logger.info('No remaining balanced users to migrate');
    process.exit();
  }

  q.push(restaurants, function completed(err, restaurant) {
    if (err) return logger.error('Unable to migrate merchants', err);
  });
});

var q = utils.async.queue(migrateRestaurant, concurrency);

q.drain = function drained() {
  logger.info('Migration Queue Drained');
  process.exit();
};

function migrateRestaurant(restaurant, done) {
  utils.async.waterfall([
    function getBalancedCustomer(callback) {
      balanced.Customers.get(restaurant.balanced_customer_uri, callback);
    },

    function getStripeId(customer, callback) {
      if (customer.meta['stripe.account_id']) {
        // existing balanced customer has transaction history
        // so stripe automatically creates an account
        return callback(null, customer.meta['stripe.account_id']);
      } else {
        // this restaurant has no transaction history, so we must
        // manually create an account
        utils.stripe.accounts.create({
          managed: true
        , country: 'US'
        , business_name: restaurant.name
        }, function(err, acct) {
          return callback(err, err ? null : acct.id );
        });
      }
    },

    function setStripeId(stripe_id, callback) {
      logger.info([
        'Restaurant #' + restaurant.id
      , 'Balanced URI:'
      , restaurant.balanced_customer_uri
      , '-> Stripe ID'
      , stripe_id
      , ].join(' '));
      db.restaurants.update({ id: restaurant.id }, { stripe_id: stripe_id }, { returning: ['*'] }, callback);
    }
  ], done);
}
