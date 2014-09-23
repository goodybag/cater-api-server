/**
 * Submitted notification
 */

var notifier  = require('../order-notifier');
var config    = require('../../config');
var app       = require('../../app');
var utils     = require('../../utils');

// Returns array of email addresses from an order notification
var getRecipientEmail = function(notification, order) {
  if ( notification.to === 'user' ){
    return order.user.email;
  } else if ( notification.to === 'restaurant' ){
    var emails = order.restaurant.contacts
                  .filter( function( contact ){ return !!contact.notify; })
                  .map( function( contact ){ return contact.emails; });
    return utils.flatten( emails );
  } else {
    return [];
  }
}

/**
 * Simplified notification registration for changed orders
 *
 * @param notification object with options for
 *   raw - bool for sending raw text email
 *   name - string for notification name
 *   to - string either 'user' or 'restaurant' automatically selecting target address
 *   previous - old parameter field
 */
var registerChanged = function(notification) {
  var name = notification.name;
  var id = name.toLowerCase().split(' ').join('-');
  var description = "Notify " + name.toLowerCase();

  notifier.register({
    type: 'changed'
  , id: id
  , name: name
  , description: description
  , requiredOptions: notification.previous ? [ notification.previous ] : null
  , build: function( order, logger, options, callback) {
      logger.info('Setting up email "%s"', notification.name, { notification: notification });
      var email = {
        to:         getRecipientEmail(notification, order)
      , from:       config.emails.orders
      , subject:    'Goodybag Order #' + order.id + ' has been changed!'
      };

      var viewOptions = {
        layout: notification.raw ? null : 'email-layout'
      , config: config
      , order:  order
      , previous: options[notification.previous]
      };

      app.render( 'order-email/' + id, viewOptions, function( error, html ){
        if ( !error ) email.html = html;
        callback( error, email );
      });
    }
  });
}

var notifications = [
  { name: 'User Delivery Fee Changed', to: 'user', previous: 'oldDeliveryFee'}
, { name: 'Restaurant Delivery Fee Changed', to: 'restaurant', previous: 'oldDeliveryFee' }
, { name: 'User Order Items Changed', to: 'user' }
, { name: 'Restaurant Order Items Changed', to: 'restaurant', previous: 'changedDescription', raw: true }
];

notifications.forEach(registerChanged);

// notifier.register({
//   type: 'changed'
// , id: 'user-delivery-fee-changed'
// , name: 'User Delivery Fee Changed'
// , description: 'Notifies user of a delivery fee change.'
// // , requiredOptions: ['oldDeliveryFee']
// , build: function( order, logger, options, callback ){
    
//   }
// });

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