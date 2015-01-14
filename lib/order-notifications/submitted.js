/**
 * Submitted notification
 */

var moment    = require('moment-timezone');
var notifier  = require('../order-notifier');
var config    = require('../../config');
var app       = require('../../app');
var utils     = require('../../utils');

notifier.register({
  type: 'submitted'
, id: 'user-order-submitted'
, name: 'User Order Submitted'
, description: [
    'Sends the user on the order an email notifying them '
  , 'that their order was submitted'
  ].join('')
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: 'email-layout'
    , config: config
    , order:  order
    };

    var email = {
      to:         order.user.email
    , from:       config.emails.orders
    , subject:    [ 'Goodybag order (#', order.id, ') has been submitted' ].join('')
    };

    logger.info( 'Setting up email', email );

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/user-order-submitted', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});

notifier.register({
  type: 'submitted'
, id: 'restaurant-order-submitted'
, name: 'Restaurant Order Submitted'
, description: [
    'Sends the restaurant on the order an email notifying them '
  , 'that an order was submitted'
  ].join('')
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: 'email-layout'
    , config: config
    , order:  order
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
    , subject:    'You have received a new Goodybag Order #' + order.id
    };

    logger.info( 'Setting up email', email );

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/restaurant-order-submitted', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});

notifier.register({
  type: 'submitted'
, id: 'goodybaggers-ds-order'
, name: 'Goodybaggers DS Order'
, description: [
    'Sends an email notifying Goodybaggers that a DS order has been placed.'
  , ' If order is within 48 hours, adds [ASAP] to the subject'
  ].join('')
, build: function( order, logger, options, callback ){
    var $48    = moment().tz( order.region.timezone ).add( 'hours', 48 );
    var isAsap = $48 > moment( order.datetime ).tz( order.region.timezone );

    var viewOptions = {
      layout: false
    , config: config
    , order:  order
    , isAsap: isAsap
    };

    var email = {
      to:         config.emails.dsOrders
    , from:       config.emails.orders
    , subject:    (isAsap ? '[ASAP] ' : '') + '[DS] Goodybag Order #' + order.id + ' placed!'
    };

    logger.info( 'Setting up email', email );

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/gb-ds-order', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});

notifier.register({
  type: 'submitted'
, id: 'restaurant-order-submitted-sms'
, name: 'Restaurant Order Submitted SMS'
, format: 'sms'
, description: 'Send a text to the list of restaurant SMS phone numbers'
, build: function( order, logger, options, callback) {
    var url = config.baseUrl + '/orders/' + order.id + '?review_token=' + order.review_token;
    utils.bitly.shorten(url, function(err, response) {
      if (err) {
        logger.error('unable to shorten url, attempting to sms unshortend link', err);
      }

      url = ((response||0).data||0).url || url;

      var viewOptions = {
        layout: false
      , order: order
      , url: url
      };

      var sms_phones = utils.flatten(utils.pluck(order.restaurant.contacts, 'sms_phones'));
      var notification = {
        to: sms_phones
      , from: config.phone.orders
      };
      app.render( 'sms/restaurant-order-submitted-sms', viewOptions, function( error, html ){
        notification.html = html;
        callback(error, notification);
      });
    });
  }
});

notifier.register({
  type: 'submitted'
, id: 'restaurant-order-submitted-voice'
, name: 'Restaurant Order Submitted Voice'
, format: 'voice'
, description: 'Calls list of restaurant phone numbers'
, build: function( order, logger, options, callback) {
    var viewOptions = {
      layout: false
    , order: order
    };

    var voice_phones = utils.flatten(utils.pluck(order.restaurant.contacts, 'voice_phones'));
    var notification = {
      to: voice_phones
    , from: config.phone.orders
    , url: config.baseUrl + '/orders/' + order.id + '/voice',
    };
    app.render( 'order-voice', viewOptions, function( error, html ){
      notification.html = html;
      callback(error, notification);
    });
  }
});

notifier.register({
  type: 'submitted'
, id: 'delivery-service-order-submitted'
, name: 'Delivery Service Order Submitted'
, description: [
    'Sends the delivery service an email notifying them the '
  , 'pickup and delivery info.'
  ].join('')
, isAvailable: function( order ){
    return order.type === 'courier';
  }
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: false
    , config: config
    , order: order
    };

    var email = {
      to: order.deliveryService.order_email.split(',')
    , from: config.emails.orders
    , subject: [ 'Goodybag order (#', order.id, ') has been scheduled for delivery' ].join('')
    };

    logger.info( 'Setting up email', email );

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/delivery-service-order-submitted', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});

notifier.register({
  type: 'submitted'
, id: 'notify-om-user-order'
, name: 'Notify Om of submitted orders based on key users'
, description: [
    'When a key user submits an order, send Om an email'
  ].join('')
, isAvailable: function( order ){
    return utils.contains(config.notableUserIds, order.user_id );
  }
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: false
    , config: config
    , order: order
    };

    var email = {
      to: config.notableUserWarningRecipient
    , from: config.emails.orders
    , subject: [
        '[Alert] Flag This Order - User #'
      , order.user_id
      ].join('')
    };


    logger.info( 'Setting up email', email );

    app.render( 'order-email/notable-user-order-submitted', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});

notifier.register({
  type: 'submitted'
  , id: 'cs-non-contracted-order-sms'
  , name: 'Customer Support Non-Contracted Restaurant Order SMS'
  , format: 'sms'
  , description: 'Send a text to customer support about orders submitted to non-contracted restaurants'
  , build: function( order, logger, options, callback) {
    var url = config.baseUrl + '/orders/' + order.id + '?review_token=' + order.review_token;
    utils.bitly.shorten(url, function(err, response) {
      if (err) {
        logger.error('unable to shorten url, attempting to sms unshortend link', err);
      }

      url = ((response||0).data||0).url || url;

      var viewOptions = {
        layout: false
      , order: order
      , url: url
      };

      var sms_phones = config.deliveryServices.supportPhones;
      var notification = {
        to: sms_phones
      , from: config.phone.orders
      };
      app.render( 'sms/cs-non-contracted-order-sms', viewOptions, function( error, html ){
        notification.html = html;
        callback(error, notification);
      });
    });
  }
});
