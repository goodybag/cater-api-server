/**
 * Submitted notification
 */

var notifier  = require('../order-notifier');
var config    = require('../../config');
var app       = require('../../app');
var utils     = require('../../utils');

notifier.register({
  type: 'changed'
, id: 'restaurant-order-delivery-date-changed'
, name: 'Restaurant Order Delivery Date Changed'
, description: [
    'Sends the restaurant on the order an email notifying them '
  , 'that an order delivery date was changed.'
  , 'Example: 2014-02-12 3:00 PM'
  ].join('')
, requiredOptions: ['oldDatetime']
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: 'email-layout'
    , config: config
    , order:  order
    , oldDatetime: options.oldDatetime
    };

    var restaurantEmails = order.restaurant.contacts.filter( function( contact ){
      return !!contact.notify;
    }).map( function( contact ){
      return contact.emails;
    });

    restaurantEmails = utils.flatten( restaurantEmails );

    var email = {
      to:         restaurantEmails
    , from:       config.emails.orders
    , subject:    'Goodybag Order #' + order.id + ' has been changed!'
    };

    logger.info( 'Setting up email', email );

    if ( options.render === false ){
      return callback( null, email );
    }

    if ( !options.oldDatetime ){
      return callback('Order notification: ' + this.id + ' did not have options.oldDatetime');
    }

    app.render( 'order-email/restaurant-delivery-date-changed', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});