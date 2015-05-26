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
  } else if ( notification.to === 'courier' ){
    // flatten in case order_email is array or string
    return utils.flatten([order.deliveryService.order_email]);
  } else {
    return [];
  }
}

var getRecipientPhoneNumber = function (notification, order) {
  if (notification.to === 'user') {
    return order.phone;
  } else if (notification.to === 'restaurant') {
    var contacts = utils.filter(order.restaurant.contacts, function(contact) {
      return !contact.disable_sms;
    });
    return utils.flatten(utils.pluck(contacts, 'sms_phones'));
  } else if (notification.to === 'courier') {
    return utils.flatten([order.deliveryService.order_phone]);
  } else {
    return [];
  }
};

/**
 * Simplified notification registration for changed orders
 *
 * @param notification object with options for
 *   raw - bool for sending raw text email
 *   name - string for notification name
 *   to - string either 'user' or 'restaurant' automatically selecting target address
 *   options - required options for notification
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
  , requiredOptions: Array.isArray(notification.requiredOptions) ? notification.requiredOptions : null
  , options: Array.isArray(notification.options) ? notification.options : null
  , build: function( order, logger, options, callback) {
      logger.debug('Setting up email "%s"', notification.name, { notification: notification });
      var email = {
        to:         getRecipientEmail(notification, order)
      , from:       config.emails.orders
      , subject:    'Goodybag Order #' + order.id + ' has been changed!'
      };

      var viewOptions = {
        layout: notification.raw ? null : 'email-layout'
      , config: config
      , order:  order
      , options: options
      };

      app.render( 'order-email/' + id, viewOptions, function( error, html ){
        if ( !error ) email.html = html;
        callback( error, email );
      });
    }
  });
};

var registerDateChanged = function(notification) {
  var name = notification.name;
  var id = name.toLowerCase().split(' ').join('-');

  notifier.register({
    type:'changed'
  , id: id
  , name: name
  , description: [
      'Sends an email notifying them '
    , 'that an order delivery date was changed.'
    , 'Example: 2014-02-12 3:00 PM'
    ].join('')
  , requiredOptions: Array.isArray(notification.requiredOptions) ? notification.requiredOptions : null
  , options: Array.isArray(notification.options) ? notification.options : null
  , build: function( order, logger, options, callback ){
      var viewOptions = {
        layout: 'email-layout'
      , config: config
      , order: order
      , oldDatetime: options.oldDatetime
      };

      var email = {
        to:         getRecipientEmail(notification, order)
      , from:       config.emails.orders
      , subject:    'Goodybag Order #' + order.id + 'delivery date has been changed!'
      };

      logger.debug( 'Setting up email', email );

      if ( options.render === false ){
        return callback( null, email );
      }

      app.render( 'order-email/' + id, viewOptions, function( error, html ){
        if ( error ){
          return callback( error );
        }

        email.html = html;

        callback( null, email );
      });
    }
  });
};

var registerSMSChanged = function (notification) {
  var name = notification.name;
  var id = name.toLowerCase().split(' ').join('-');

  notifier.register({
    type: 'changed'
  , id: id
  , name: name
  , format: 'sms'
  , description: "Sends an SMS indicating that the order delivery date was changed"
  , requiredOptions: Array.isArray(notification.requiredOptions) ? notification.requiredOptions : null
  , options: Array.isArray(notification.options) ? notification.options : null
  , build: function (order, logger, options, callback) {
      var url;

      if ( notification.to === 'restaurant' ) {
        url = config.baseUrl + '/orders/' + order.id + '?review_token=' + order.review_token;
      } else {
        url = config.baseUrl + '/orders/' + order.id;
      }

      utils.bitly.shorten(url, function(err, response) {
        if (err) {
          logger.error('unable to shorten url, attempting to sms unshortend link', err);
        }

        url = ((response || 0).data||0).url || url;
        var viewOptions = {
          layout: false
        , order: order
        , oldDatetime: options.oldDatetime
        , url: url
        };

        var sms = {
          to: getRecipientPhoneNumber(notification, order)
        , from: config.phone.orders
        };

        logger.debug("sms setup ", sms);

        if ( options.render === false ){
          return callback( null, sms );
        }

        app.render('sms/order-date-changed-sms', viewOptions, function (error, html) {
          if ( error ) {
            callback( error );
          }

          sms.html = html;
          callback ( null, sms );
        });
      });

    }
  });
};

var notifications = [
  { name: 'User Delivery Fee Changed', to: 'user', requiredOptions: ['oldDeliveryFee'] }
, { name: 'Restaurant Delivery Fee Changed', to: 'restaurant', requiredOptions: ['oldDeliveryFee'] }
, { name: 'User Order Items Changed', to: 'user', options: ['changedDescription'] }
, { name: 'Restaurant Order Items Changed', to: 'restaurant', requiredOptions: ['changedDescription'], raw: true }
, { name: 'Restaurant Order Type Changed', to: 'restaurant' }
];

var dateChangeNotifications = [
  { name: 'Restaurant Order Delivery Date Changed', to: 'restaurant' }
, { name: 'User Order Delivery Date Changed', to: 'user' }
];

var smsNotifications = [
  { name: "Restaurant Order Delivery Date Changed SMS", to: 'restaurant' }
];

notifications.forEach(registerChanged);
dateChangeNotifications.forEach(registerDateChanged);
smsNotifications.forEach(registerSMSChanged);
