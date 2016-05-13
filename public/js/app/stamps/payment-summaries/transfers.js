var mosql   = require('mongo-sql');
var db      = require('db');
var utils   = require('utils');
var errors  = require('errors');
var logger  = require('../../../../../lib/logger').create('PaymentSummary-Transfers');

module.exports = require('stampit')()
  .compose( require('./db') )
  .state({

  })
  .methods({
    transferToStripeAccount: function( stripe_id, callback ){
      var data = {
        amount: this.getTotalPayout()
      , currency: 'usd'
      , destination: this.stripe_id
      , description: 'Payment #' + this.id
      };

      utils.stripe.transfers.create( data, ( error, result )=>{
        if ( error ){
          return this.appendLog( 'error', { error }, ()=> callback( error ) );
        }

        this.appendLog( 'in-account', { result }, ()=> callback( null, this ) );
      });
    }

  , transferToBankAccount: function( stripe_id, callback ){
      var data = {
        amount: this.getTotalPayout()
      , currency: 'usd'
      , destination: 'default_for_currency'
      , description: 'Payment #' + this.id
      };

      var options = {
        stripe_account: 'acct_16CZlbImWewFwddn'
      };

      utils.stripe.transfers.create( data, ( error, result )=>{
        if ( error ){
          return this.appendLog( 'error', { error }, ()=> callback( error ) );
        }

        this.appendLog( 'paid', { result }, ()=> callback( null, this ) );
      });
    }
  });
