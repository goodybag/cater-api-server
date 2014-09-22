/**
 * Warning notifications
 */

var notifier  = require('../order-notifier');
var scheduler = require('../scheduler');
var config    = require('../../config');
var app       = require('../../app');
var db        = require('../../db');

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