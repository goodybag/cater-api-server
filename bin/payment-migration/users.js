var db = require('db');
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
  if ( !users.length ) return logger.info('No remaining balanced users to migrate');

  q.push(users, function completed(err, user) {
    if (err) return logger.error('Unable to migrate customers', err);
  });
});

var q = utils.async.queue(migrateUser, concurrency);
q.drain = function drained() {
  logger.info('Migration Queue Drained');
  process.exit();
}

// 1. look up balanced customer by user.balanced_customer_uri
// 2. db update users.stripe_id with balanced customer metadata stripe.customer_id
function migrateUser(user, callback) {
  utils.balanced.Customers.get(user.balanced_customer_uri, function(err, customer){
    if ( err )
      return logger.error('Unable to get balanced customer ' + user.balanced_customer_uri, err);

    if ( !customer.meta['stripe.customer_id'] )
      return logger.error('Unable to associate stripe metadata', err);

    db.users.update({ id: user.id }, { stripe_id: customer.meta['stripe.customer_id'] }, { returning: ['*'] }, function(err) {
      logger.info('User #' + user.id  + ' Balanced URI: ' + user.balanced_customer_uri + ' -> Stripe: ' + customer.meta['stripe.customer_id']);
      callback(err, user);
    });
  });
};