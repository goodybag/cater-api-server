#!/usr/bin/env node

var options = { stripe_id: 'card_16HfaiEQiCMC2eZ7pqrrTdPp' };
var fs      = require('fs');
var async   = require('async');
var db      = require('db');
var utils   = require('utils');

if ( fs.existsSync( __dirname + '/../../local-config.json') ){
  var testConfig = require('../../local-config.json');
  options.stripe_id = testConfig.paymentMethodStripeId || options.stripe_id;
}

console.log( "using options:", options );

var $query    = { }
var $update   = { stripe_id: options.stripe_id };
var $options  = { returning: ['*'] };

db.payment_methods.update($query, $update, $options, function(err, pms) {
  if (err) throw Error;
  console.log( '✓', pms.length, "payment methods updated!" );
  process.exit(0);
});
