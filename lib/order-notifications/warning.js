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