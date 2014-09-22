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

    logger.info( 'Setting up email', email );

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
, id: 'some-notifications-not-sent'
, name: 'Some Notifications Not Sent'
, description: [
    'Sends an email notifying Goodybaggers that an order did not send out its notifications'
  ].join('')
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: false
    , config: config
    , order:  order
    };

    var email = {
      to:         config.emails.orderNotificationChecks
    , from:       config.emails.info
    , subject:    '[Warning] Some Notifications Not Sent'
    };

    logger.info( 'Setting up email', email );

    if ( options.render === false ){
      return callback( null, email );
    }

    email.html =  [ '<p><strong>So yeah, sorry, the notifications for this order probably didn\'t send</strong></p>'
                  , '<a href="' + config.baseUrl + '/admin/orders/' + order.id + '">#' + order.id + '</a>'
                  ].join('\n');

    callback( null, email );
  }
});