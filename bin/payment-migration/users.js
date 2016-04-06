var db = require('../../db');
var config = require('../../config');
var logger = require('./logger').create('User Setup');
var utils = require('../../utils');
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
  var customer_uri = user.balanced_customer_uri.split('/');
  customer_uri = customer_uri[customer_uri.length - 1];

  utils.request({
    url: 'https://api.balancedpayments.com/customers/'  + customer_uri
  , headers: { Accept: 'application/vnd.api+json;revision=1.1' }
  , auth: { user: config.balanced.secret }
  }, function(err, response, body) {
    if ( err )
      return logger.error('Unable to get balanced customer ' + customer_uri, err);

    try {
      body = JSON.parse(body);
    } catch(e) {
      return callback(e);
    }

    var customer = body['customers'][0];

    if ( !customer.meta['stripe.customer_id'] )
      return logger.error('Unable to associate stripe metadata', err);

    db.users.update({ id: user.id }, { stripe_id: customer.meta['stripe.customer_id'] }, { returning: ['*'] }, function(err) {
      logger.info('User #' + user.id  + ' Balanced URI: ' + user.balanced_customer_uri + ' -> Stripe: ' + customer.meta['stripe.customer_id']);
      callback(err, user);
    });
  });
};
