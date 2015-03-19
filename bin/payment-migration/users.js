var db = require('db');
var config = require('config');
var stripe = require('stripe')(config.stripe.secret);
var logger = require('./logger').create('User Setup');
var utils = require('utils');
var concurrency = 5;

logger.info('Mapping balanced uri to stripe ids');

var $query = {
  balanced_customer_uri: { $notNull: true }
, stripe_id: { $null: true }
};

db.users.find($query, function(err, users) {
  if ( err ) return logger.error('Unable to find users', err);

  q.push(users, function completed(err, user) {
    if (err) return logger.error('Unable to migrate customers', err);
    logger.info('Migrated customer #' + user.id);
  });
});

var q = utils.async.queue(migrateUser, concurrency);
q.drain = function drained() { logger.info('Migration Queue Drained'); }

// 1. look up balanced customer by user.balanced_customer_uri
// 2. db update users.stripe_id with balanced customer metadata stripe.customer_id
function migrateUser(user, callback) {
  utils.balanced.Customers.get(user.balanced_customer_uri, function(err, customer){
    if (err) return logger.error('Unable to get balanced customer ' + user.balanced_customer_uri, err);

    logger.info('Mapped Balanced: ' + user.balanced_customer_uri + ' -> Stripe: ' + customer.meta.stripe.id);
    callback(null, user);
  });
};
