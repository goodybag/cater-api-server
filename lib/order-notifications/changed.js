/**
 * Submitted notification
 */

var notifier  = require('../order-notifier');
var config    = require('../../config');
var app       = require('../../app');

notifier.register({
  type: 'changed'
, id: 'restaurant-order-delivery-date-changed'
, name: 'Restaurant Order Delivery Date Changed'
, description: [
    'Sends the restaurant on the order an email notifying them '
  , 'that an order delivery date was changed'
  ].join('')
, requiredOptions: ['oldDatetime']
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: 'email-layout'
    , config: config
    , order:  order.toJSON({ review: true })
    , oldDatetime: options.oldDatetime
    };

    var email = {
      to:         order.attributes.restaurant.emails
    , from:       config.emails.orders
    , subject:    'Goodybag Order #' + order.attributes.id + ' has been changed!'
    };

    if ( options.render === false ){
      return callback( null, email );
    }

    if ( !options.oldDatetime ){
      return callback('Order notification: ' + this.id + ' did not have options.oldDatetime');
    }

    app.render( 'order-email/delivery-date-changed', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});