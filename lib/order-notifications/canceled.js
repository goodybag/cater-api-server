/**
 * Canceled notification
 */

var notifier  = require('../order-notifier');
var config    = require('../../config');
var app       = require('../../app');
var utils     = require('../../utils');
var db        = require('../../db');

notifier.register({
  type: 'canceled'
, id: 'user-order-canceled'
, name: 'User Order Canceled'
, description: [
    'Sends an email notifying the user that their order was canceled'
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
    , subject:    'Goodybag Order #' + order.id + ' has been canceled!'
    };

    logger.debug( 'Setting up email', email );

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/user-order-canceled', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});

notifier.register({
  type: 'canceled'
, id: 'restaurant-order-canceled'
, name: 'Restaurant Order Canceled'
, description: [
    'Sends an email notifying the restaurant that their order was canceled'
  ].join('')
, disablePriceHike: true
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
    , subject:    'Goodybag Order #' + order.id + ' has been canceled!'
    };

    logger.debug( 'Setting up email', email );

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/restaurant-order-canceled', viewOptions, function( error, html ){
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
, id: 'restaurant-order-canceled-sms'
, name: 'Restaurant Order Canceled SMS'
, format: 'sms'
, description: 'Text the restaurant about a canceled order'
, disablePriceHike: true
, build: function( order, logger, options, callback) {
    var contacts = utils.filter(order.restaurant.contacts, function (contact) {
      return !contact.disable_sms;
    });

    var sms_phones = utils.flatten(utils.pluck(contacts, 'sms_phones'));

    var notification = {
      to: sms_phones
    , from: config.phone.orders
    };

    if ( options.render === false ){
      return callback( null, notification );
    }

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

      app.render( 'sms/restaurant-order-canceled', viewOptions, function( error, html ){
        notification.html = html;
        callback(error, notification);
      });
    });
  }
});


notifier.register({
  type: 'canceled'
, id: 'goodybaggers-order-canceled'
, name: 'Goodybaggers Order Canceled'
, description: [
    'Sends an email notifying Goodybaggers that an order was canceled'
  ].join('')
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: 'email-layout'
    , config: config
    , order:  order
    };

    var email = {
      to:         config.deniedRecipients
    , from:       config.emails.orders
    , subject:    'Goodybag Order #' + order.id + ' has been canceled!'
    };

    logger.debug( 'Setting up email', email );

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/gb-order-canceled', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});

notifier.register({
  type: 'canceled'
, id: 'delivery-service-order-canceled'
, name: 'Delivery Service Order Canceled'
, description: [
    'Sends an email notifying delivery service that an order was canceled'
  ].join('')
, disablePriceHike: true
, isAvailable: function( order ){
    return order.type === 'courier';
  }
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: false
    , config: config
    , order:  order
    };

    utils.async.waterfall([
      function( next ){
        if ( !options.delivery_service_id ){
          return next( null, order.deliveryService );
        }

        db.delivery_services.findOne( options.delivery_service_id, next );
      }

    , function( deliveryService, next ){
        var email = {
          to:         deliveryService.order_email.split(',')
        , from:       config.emails.couriers
        , subject:    'Goodybag Order #' + order.id + ' has been canceled!'
        };

        logger.debug( 'Setting up email', email );

        if ( options.render === false ){
          return callback( null, email );
        }

        app.render( 'order-email/delivery-service-order-canceled', viewOptions, function( error, html ){
          if ( error ){
            return callback( error );
          }

          email.html = html;

          callback( null, email );
        });
      }
    ], function( error ){
      if ( error ){
        return callback( error );
      }
    });
  }
});
