/**
 * Warning notifications
 */

var notifier  = require('../order-notifier');
var scheduler = require('../scheduler');
var config    = require('../../config');
var app       = require('../../app');
var db        = require('../../db');

notifier.register({
  type: 'warning'
, id: 'goodybaggers-ds-order-needs-attention'
, name: 'Goodybaggers DS Order Needs Attention'
, description: [
    'Sends an email notifying Goodybaggers that a DS order has not been accepted by the delivery service'
  ].join('')
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: false
    , config: config
    , order:  order
    };

    var email = {
      to:         config.emails.dsOrders
    , from:       config.emails.orders
    , subject:    '[DS] Goodybag Order #' + order.id + ' needs attention!'
    };

    logger.debug( 'Setting up email', email );

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/gb-ds-order-needs-attention', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});

notifier.register({
  type: 'warning'
, id: 'gb-order-payment-failed'
, name:'Goodybaggers Order Payment Failed'
, description: 'Sends tech an email for order payment failure'
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: false
    , config: config
    , order: order
    };

    var email = {
      to:   config.emails.tech
    , from: config.emails.orders
    , subject: '[Warning] Goodybag Order #' + order.id + ' failed payment processing!'
    };

    logger.debug('Setting up email', email );

    app.render( 'order-email/gb-order-payment-failed', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});

notifier.register({
  type: 'warning'
, id: 'user-order-payment-failed'
, name: 'User Order Payment Failed'
, description: 'Send an email to the user when a credit card is declined'
, isAvailable: function ( order ) {
    return order.status === 'accepted'; 
  }
, build: function ( order, logger, options, callback ) {
    var viewOptions ={
      layout: 'email-layout'
    , config: config
    , order: order
    };  

    var email = {
      to: order.user.email
    , from: config.emails.order
    , subject: 'Cannot Process Order: Your Credit Card Transaction Was Declined'
    };

    logger.debug('Setting up email', email );

    if ( options.render === false ) {
      return callback( null , email );
    }

    app.render('order-email/user-order-payment-failed',viewOptions, function (error, html) {
      if ( error ) { 
        return callback( error ); 
      }

      email.html = html;
      callback(null, email);
    });
  }
});
