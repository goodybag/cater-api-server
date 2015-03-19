var db = require('db');
var config = require('config');
var stripe = require('stripe')(config.stripe.secret);
var logger = require('./logger').create('User Setup');

logger.info('Mapping balanced uri to stripe ids');

db.users.find({}, function(err, users) {
  if ( err ) {
    return logger.error('Unable to find users', err);
  }
  console.log(users.length);
});
