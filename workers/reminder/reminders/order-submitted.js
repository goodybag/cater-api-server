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
  return function(callback) {
    var context = {
      order: order.toJSON({review: true})
    , config: config
    , layout: 'email-layout'
    };
    views.render('order-email/order-submitted', context, function(error, html) {
      if (error) return callback(error);
      utils.sendMail2({
        to:   order.attributes.restaurant.emails
      , from: config.emails.orders
      , html: html
      , subject: 'You have received a new Goodybag Order #' + order.attributes.id
      }, function(error) {
        callback(error, order);
      });

    });
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

  // 1. Find submitted orders not notified
  // 2. Email notifications in parallel
  Models.Order.find( getQuery(storage), function( error, results) {
    if (error) return done(error);

    var fns = results.map(sendEmail);
    utils.async.parallelNoBail(fns, function emailsSent(errors, results) {
      if (errors) {
        errors.forEach(function(e) {
          Object.keys(e).forEach(function(key) {
            stats.errors.value++;
            stats.errors.objects.push(e[key]);
          });
        });
      }

      // scan results for stats
      results.forEach(function(result) {
        if (!result || Object.keys(result).length === 0) return;

        stats.submittedOrders.value++;
        storage.lastNotified[result.attributes.id] = new Date().toString();
      });
      done(error, stats);
    });
  });
};
