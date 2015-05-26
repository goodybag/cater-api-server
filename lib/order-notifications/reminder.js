/**
 * Warning notifications
 */

var moment    = require('moment');
var notifier  = require('../order-notifier');
var scheduler = require('../scheduler');
var config    = require('../../config');
var app       = require('../../app');
var db        = require('../../db');
var utils     = require('../../utils');
var helpers   = require('../../public/js/lib/hb-helpers');

function hasSmsContacts( order ){
  var contacts = utils.filter(order.restaurant.contacts, function (contact) {
    return !contact.disable_sms;
   });
  var sms_phones = utils.flatten(utils.pluck(contacts, 'sms_phones'));
  return sms_phones && sms_phones.length > 0;
}

notifier.register({
  type: 'reminder'
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

    logger.debug( 'Setting up email', email );

    if ( options.render === false ){
      return callback( null, email );
    }

    email.html =  [ '<p><strong>So yeah, sorry, the notifications for this order probably didn\'t send</strong></p>'
                  , '<a href="' + config.baseUrl + '/admin/orders/' + order.id + '">#' + order.id + '</a>'
                  ].join('\n');

    callback( null, email );
  }
});

notifier.register({
  type: 'reminder'
, id: 'client-tomorrow-order'
, name: 'Office Admin Order Tomorrow Reminder'
, description: [
    'Sends an email to the office admin notifying that there is an order tomorrow'
  ].join('')
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: 'email-layout'
    , config: config
    , order:  order
    };

    var emailSubject = ({
      delivery: {
        action: ' to be delivered'
      , datetime: order.datetime
      }
    , courier: {
        action: ' to be delivered by a courier'
      , datetime: order.pickup_datetime
      }
    , pickup: {
        action: ' to be picked up'
      , datetime: order.pickup_datetime
      }
    })[ order.type ];

    var email = {
      to:         order.user.email
    , from:       config.emails.orders
    , subject:    [ '[REMINDER] Goodybag Order #'
                  , order.id
                  , emailSubject.action
                  , ' tomorrow'
                  ].join('')
    };

    logger.debug( 'Setting up email', email );

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/order-reminder-user', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});

notifier.register({
  type: 'reminder'
, id: 'restaurant-tomorrow-order'
, name: 'Restaurant Order Tomorrow Reminder'
, description: [
    'Sends an email to the restaurant notifying that there is an order tomorrow'
  ].join('')
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: 'email-layout'
    , config: config
    , order:  order
    };

    var emailSubject = ({
      delivery: {
        action: ' to be delivered by you'
      , datetime: order.datetime
      }
    , courier: {
        action: ' to be picked up by a courier'
      , datetime: order.pickup_datetime
      }
    , pickup: {
        action: ' to be picked up by the customer'
      , datetime: order.pickup_datetime
      }
    })[ order.type ];

    var email = {
      to:         utils.flatten( utils.pluck( order.restaurant.contacts, 'emails' ) )
    , from:       config.emails.orders
    , subject:    [ '[REMINDER] Goodybag Order #'
                  , order.id
                  , emailSubject.action
                  , emailSubject.datetime ?
                      ' on ' + moment( emailSubject.datetime ).format(
                        'MM-DD-YYYY h:mma'
                      ).split(' ').join(' at ')
                    : ' tomorrow'
                  ].join('')
    };

    logger.debug( 'Setting up email', email );

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/order-reminder-restaurant', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});

notifier.register({
  type: 'reminder'
, id: 'restaurant-tomorrow-order-sms'
, name: 'Restaurant Order Tomorrow Reminder SMS'
, description: [
    'Sends an sms to the restaurant notifying that there is an order tomorrow'
  ].join('')
, format: 'sms'
, isAvailable: hasSmsContacts
, build: function( order, logger, options, callback ){
    var url = config.baseUrl + '/orders/' + order.id + '?review_token=' + order.review_token;
    utils.bitly.shorten(url, function(err, response) {
      if (err) {
        logger.error('unable to shorten url, attempting to sms unshortend link', err);
      }

      url = ((response||0).data||0).url || url;

      var viewOptions = {
        layout: null
      , config: config
      , order:  order
      , url: url
      , subject: ({
          delivery: { action: ' to be delivered by you',          datetime: order.datetime }
        , courier:  { action: ' to be picked up by a courier',    datetime: order.pickup_datetime }
        , pickup:   { action: ' to be picked up by the customer', datetime: order.pickup_datetime }
        })[ order.type ]
      };

      var contacts = utils.filter(order.restaurant.contacts, function(contact) {
        return !contact.disable_sms;
      });

      var sms = {
        to: utils.flatten(utils.pluck(contacts, 'sms_phones'))
      , from: config.phone.orders
      };

      logger.debug( 'Setting up SMS', sms );

      if ( options.render === false ){
        return callback( null, sms );
      }

      app.render( 'sms/restaurant-tomorrow-order', viewOptions, function( error, html ){
        if ( error ){
          return callback( error );
        }
        sms.html = html;
        callback( null, sms );
      });
    });
  }
});

notifier.register({
  type: 'reminder'
, id: 'order-submitted-but-ignored'
, name: 'Order Submitted But Ignored'
, description: [
    'Sends an email to Goodybaggers letting us know that a restaurant has ignored a submitted order'
  ].join('')
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: 'email-layout'
    , config: config
    , order:  order
    };

    var email = {
      to:         config.emails.reminderIgnored
    , from:       config.emails.orders
    , subject:    [ '[WARNING] Order #'
                  , order.id
                  , ' ($'
                  , helpers.dollars( order.total )
                  , ') needs attention!'
                  ].join('')
    };

    logger.debug( 'Setting up email', email );

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/order-submitted-but-ignored', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});

notifier.register({
  type: 'reminder'
, id: 'order-submitted-needs-action-sms'
, name: 'Order Submitted Needs Action SMS'
, format: 'sms'
, description: [
    'Sends an sms reminder of a submitted order to the restaurant. '
  , 'Notification is sent every hour the order has not been accepted or denied.'
  ].join('')
, isAvailable: hasSmsContacts
, build: function( order, logger, options, callback ){
    var url = config.baseUrl + '/orders/' + order.id + '?review_token=' + order.review_token;
    utils.bitly.shorten(url, function(err, response) {
      if (err) {
        logger.error('unable to shorten url, attempting to sms unshortend link', err);
      }

      url = ((response||0).data||0).url || url;

      var viewOptions = {
        layout: false
      , config: config
      , order:  order
      , url: url
      };

      var contacts = utils.filter(order.restaurant.contacts, function(contact) {
        return !!contact.notify;
      });

      var sms = {
        to: utils.flatten(utils.pluck(contacts, 'sms_phones'))
      , from: config.phone.orders
      };

      logger.debug( 'Setting up SMS', sms );

      if ( options.render === false ){
        return callback( null, sms );
      }

      app.render( 'sms/restaurant-order-submitted-reminder', viewOptions, function( error, html ){
        if ( error ){
          return callback( error );
        }
        sms.html = html;
        callback( null, sms );
      });
    });
  }
});

notifier.register({
  type: 'reminder'
, id: 'gb-payment-status-ignore'
, name: 'Order Payment Status is Ignore'
, description: [
    'Sends an email to Goodybaggers reminding them the order payment status was changed to ignore'
  ].join('')
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: false
    , config: config
    , order:  order
    };

    var email = {
      to:         config.emails.reminderPaymentStatusIgnore
    , from:       config.emails.orders
    , subject:    [ '[REMINDER] Order #'
                  , order.id
                  , ' payment status is ignore'
                  ].join('')
    };

    logger.info( 'Setting up email', email );

    if ( options.render === false ){
      return callback( null, email );
    }

    app.render( 'order-email/gb-payment-status-ignore', viewOptions, function( error, html ){
      if ( error ){
        return callback( error );
      }

      email.html = html;

      callback( null, email );
    });
  }
});
