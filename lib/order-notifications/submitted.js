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
      layout: 'order-email/layout'
    , config: config
    , order:  order
    };

    var email = {
      to:         order.user.email
    , from:       config.emails.orders
    , subject:    [ 'Goodybag order (#', order.id, ') has been submitted' ].join('')
    };

    logger.debug( 'Setting up email', email );

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
    , subject:    'You have received a new Goodybag Order #' + order.id
    };

    logger.debug( 'Setting up email', email );

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
, id: 'goodybaggers-asap-courier-order'
, name: 'Goodybaggers ASAP Courier Order'
, description: [
    'Spam various Goodybaggers with email when courier orders are placed for delivery'
  , ' in the next two hours.'
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
    , subject:    '[ASAP] Courier Goodybag Order #' + order.id + ' placed!'
    };

    logger.debug( 'Setting up email', email );

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/gb-asap-courier-order', viewOptions, function( error, html ){
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

    var url = config.baseUrl + '/orders/' + order.id + '?review_token=' + order.review_token;

    if ( options.render === false ){
      return callback( null, notification );
    }

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
, disablePriceHike: true
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

    if ( options.render === false ){
      return callback( null, notification );
    }

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
, disablePriceHike: true
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

    logger.debug( 'Setting up email', email );

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

    if ( options.render === false ){
      return callback( null, email );
    }

    logger.debug( 'Setting up email', email );

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
, id: 'gb-non-contracted-order-sms'
, name: 'Goodybaggers Non-Contracted Restaurant Order SMS'
, format: 'sms'
, description: 'Send a text to customer support about orders submitted to non-contracted restaurants'
, isAvailable: function( order ){ return !order.restaurant.plan_id; }
, build: function( order, logger, options, callback) {
    var sms_phones = config.deliveryServices.supportPhones;
    var notification = {
      to: sms_phones
    , from: config.phone.orders
    };

    if ( options.render === false ){
      return callback( null, notification );
    }

    var url = config.baseUrl + '/orders/' + order.id;
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
      app.render( 'sms/gb-non-contracted-order-sms', viewOptions, function( error, html ){
        notification.html = html;
        callback(error, notification);
      });
    });
  }
});

notifier.register({
  type: 'submitted'
, id: 'gb-non-contracted-order-email'
, name: 'Goodybaggers Non-Contracted Restaurant Order Email'
, description: [
  'Send an email to customer support about orders submitted to non-contracted restaurants'
].join('')
, isAvailable: function( order ){ return !order.restaurant.plan_id; }
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: false
    , config: config
    , order: order
    };

    var email = {
      to: config.emails.support
    , from: config.emails.orders
    , subject: [
        '[Alert] Non-contracted Restaurant Order #'
      , order.id
      ].join('')
    };

    if ( options.render === false ){
      return callback( null, email );
    }

    logger.debug( 'Setting up email', email );

    app.render( 'order-email/gb-non-contracted-order-email', viewOptions, function( error, html ){
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
, id: 'gb-after-hours-order-sms'
, name: 'Goodybaggers After Hours Order Placed SMS'
, format: 'sms'
, description: 'Send a text to customer support about orders submitted after hours'
, build: function( order, logger, options, callback) {
    var notification = {
        to: config.deliveryServices.supportPhones
      , from: config.phone.orders
      };

    if ( options.render === false ){
      return callback( null, notification );
    }

    var url = config.baseUrl + '/orders/' + order.id;
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

      app.render( 'sms/gb-after-hours-order-sms', viewOptions, function( error, html ){
        notification.html = html;
        callback(error, notification);
      });
    });
  }
});

notifier.register({
  type: 'submitted'
, id: 'gb-after-hours-order-email'
, name: 'Goodybaggers After Hours Order Placed Email'
, description: 'Send a text to customer support about orders submitted after hours'
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: false
    , config: config
    , order: order
    };

    var email = {
      to: config.emails.support
    , from: config.emails.orders
    , subject: [
        '[Alert] After Hours Order #'
      , order.id
      , ' Submitted'
      ].join('')
    };

    if ( options.render === false ){
      return callback( null, email );
    }

    logger.debug( 'Setting up email', email );

    app.render( 'order-email/gb-after-hours-order-email', viewOptions, function( error, html ){
      if ( error ) return callback( error );
      email.html = html;
      callback( null, email );
    });
  }
});

notifier.register({
  type: 'submitted'
, id: 'gb-order-promo-code'
, name: 'Notify Goodybaggers when promo code is used'
, description: 'Send Goodybaggers an email when promo code is used'
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: false
    , config: config
    , order: order
    };

    // get a list of emails senders from the promo config
    var promoEmails = Object.keys(config.promo).filter( function (k) {
      return order.promo_code &&
             config.promo[k].promo_code.indexOf(order.promo_code.toLowerCase()) > -1;
    }).map( function (k) {
      return config.promo[k].email;
    });

    var email = {
      to: utils.uniq(utils.flatten(promoEmails))
    , from: config.emails.orders
    , subject: [
        '[Promo Code] user #'
      , order.user.id
      , ' submitted promo code '
      , order.promo_code
      ].join('')
    };

    if ( options.render === false ){
      return callback( null, email );
    }

    logger.debug( 'Setting up email', email );

    app.render( 'order-email/gb-order-promo-code', viewOptions, function( error, html ){
      if ( error ) return callback( error );
      email.html = html;
      callback( null, email );
    });
  }
});
