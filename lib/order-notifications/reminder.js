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

    var email = {
      to:         order.user.email
    , from:       config.emails.orders
    , subject:    [ '[REMINDER] Goodybag Order #'
                  , order.id
                  , ' to be delivered '
                  , order.datetime
                    ? 'on ' + moment( order.datetime ).format('MM-DD-YYYY')
                    : 'tomorrow'
                  ].join('')
    };

    logger.info( 'Setting up email', email );

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

    var email = {
      to:         utils.flatten( utils.pluck( order.restaurant.contacts, 'emails' ) )
    , from:       config.emails.orders
    , subject:    [ '[REMINDER] Goodybag Order #'
                  , order.id
                  , ' to be delivered '
                  , order.datetime
                    ? 'on ' + moment( order.datetime ).format(
                        'MM-DD-YYYY h:mma'
                      ).split(' ').join(' at ')
                    : 'tomorrow'
                  ].join('')
    };

    logger.info( 'Setting up email', email );

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