/**
 * Order submitted notifications
 *
 * Description:
 *   Checks for submitted orders and sends notifications
 *   at appropriate times (not in the middle of the night)
 */

var config = require('../../../config');
var Models  = require('../../../models');
var views   = require('../lib/views');

// The date we switch implementation from event triggered to reminder
var pivot = config.submittedNotificationStartDate;

module.exports.name = 'Order Submitted Notifcations';

// Ensures typeof storage.lastNotified === 'object'
module.exports.schema = {
  lastNotified: true
};

var getQuery = function( storage ) {
  var $query = {
    where: {
      status: 'submitted'
    , 'submitted.created_at': {
        $gt: pivot
      }
    }
  };

  if ( Object.keys( storage.lastNotified ).length > 0 ) {
    $query.where.id = {
      $nin: Object.keys( storage.lastNotified ).map( function( id ) {
        return parseInt( id );
      })
    };
  }

  return $query;
};

module.exports.check = function( storage, callback ){
  Models.Order.find( getQuery(storage), function( error, results ) {
    if ( error ) return callback( error );
    return callback( null, results.length > 0);
  });
};

module.exports.work = function( storage, callback ){
  var stats = {
    submittedOrders:     { text: 'Submitted Orders Notified', value: 0 }
  , errors:              { text: 'Errors', value: 0, objects: [] }
  };

  /*
   * 1 Find submitted orders not notified
   * 2 Render email
   * 3 Send mail
   */

  utils.auto({
    findSubmittedOrders: function(callback) {
      Models.Order.find(getQuery(storage), function(error, orders) {
        callback(error, orders);
      });
    },

    renderEmails: ['findSubmittedOrders', function(callback, results) {

    }],

    sendEmails: ['renderEmails', function(callback, orders) {

    }]
  });
  //
  // Models.Order.find( getQuery( storage ), function( error, orders ) {
  //   if ( error ) return callback( error );
  //   orders.forEach(function(order) {
  //     var view = {
  //       order:    order.toJSON({ review: true })
  //     , config:   config
  //     , layout:   'email-layout'
  //     };
  //     views.render('order-email/order-submitted', view, function(error, html) {
  //       utils.sendMail2({
  //         to:   order.attributes.restaurant.emails
  //       , from: config.emails.orders
  //       , html: html
  //       , subject: subject(order)
  //       }, function(error) {
  //
  //       })
  //     });
  //   })
  // });

  // callback( null, stats );
};
