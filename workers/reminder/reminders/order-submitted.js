/**
 * Order submitted notifications
 *
 * Description:
 *   Checks for submitted orders and sends notifications
 *   at appropriate times (not in the middle of the night)
 */

var config  = require('../../../config');
var utils   = require('../../../utils');
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


var sendEmail = function(order) {
  console.log(order);
  return function(callback) {
      callback(null);
  };
};

module.exports.check = function( storage, callback ){
  Models.Order.find( getQuery(storage), function( error, results ) {
    if ( error ) return callback( error );
    return callback( null, results.length > 0);
  });
};

module.exports.work = function( storage, done ){
  var stats = {
    submittedOrders:     { text: 'Submitted Orders Notified', value: 0 }
  , errors:              { text: 'Errors', value: 0, objects: [] }
  };

  /* Run this flow in parallel for each order
   * 1 Find submitted orders not notified
   * 2 Render email
   * 3 Send mail
   */
  Models.Order.find( getQuery(storage), function( error, results) {
    if (error) return done(error);

    var fns = results.map(sendEmail);
    utils.async.parallelNoBail(fns, function emailsSent(error, results) {
      done(error, stats);
    });
  });

  // utils.async.auto({
  //   findSubmittedOrders: function(callback) {
  //     console.log('step 1');
  //     Models.Order.find(getQuery(storage), function(error, orders) {
  //       callback(error, orders);
  //     });
  //   },
  //
  //   viewContexts: ['findSubmittedOrders', function(callback, results) {
  //     var orders = results.findSubmittedOrders;
  //     var contexts = orders.map(function(order) {
  //       return {
  //         order: order.toJSON({review: true})
  //       , config: config
  //       , layout: 'email-layout'
  //       };
  //     });
  //     callback(null, contexts);
  //   }],
  //
  //   sendEmails: ['renderEmails', function(callback, orders) {
  //     console.log('step 3');
  //     done(null, stats);
  //   }]
  // });

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
