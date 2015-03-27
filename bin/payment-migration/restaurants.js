var db = require('db');
var logger = require('./logger').create('User Setup');
var utils = require('utils');
var concurrency = 5;

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
    if (err) return logger.error('Unable to migrate customers', err);
  });
});

var q = utils.async.queue(migrateRestaurant, concurrency);

q.drain = function drained() {
  logger.info('Migration Queue Drained');
  process.exit();
};

// 1. look up balanced customer by restaurant.balanced_customer_uri
// 2. db update restaurant.stripe_id with balanced customer metadata stripe.customer_id
function migrateRestaurant(restaurant, callback) {
  utils.balanced.Customers.get(restaurant.balanced_customer_uri, function(err, customer){
    if ( err )
      return logger.error('Unable to get balanced customer ' + restaurant.balanced_customer_uri, err);

    if ( !customer.meta['stripe.customer_id'] )
      return logger.error('Unable to associate stripe metadata', err);

    db.restaurants.update({ id: restaurant.id }, { stripe_id: customer.meta['stripe.customer_id'] }, { returning: ['*'] }, function(err) {
      logger.info('Restaurant #' + restaurant.id  + ' Balanced URI: ' + restaurant.balanced_customer_uri + ' -> Stripe: ' + customer.meta['stripe.customer_id']);
      callback(err, restaurant);
    });
  });
}
