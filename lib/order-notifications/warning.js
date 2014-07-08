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
, id: 'goodybaggers-asap-order-needs-attention'
, name: 'Goodybaggers ASAP Order Needs Attention'
, description: [
    'Sends an email notifying Goodybaggers that an ASAP order has not been accepted by the delivery service'
  ].join('')
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: false
    , config: config
    , order:  order
    };

    var email = {
      to:         config.emails.asapOrders
    , from:       config.emails.orders
    , subject:    '[ASAP] Goodybag Order #' + order.id + ' needs attention!'
    };

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/gb-asap-order-needs-attention', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});