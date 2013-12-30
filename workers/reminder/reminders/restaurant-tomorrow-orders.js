/**
 * Restaurant Tomorrow Orders
 *
 * Description:
 *   Send notifications to restaurants with accepted orders to
 *   fulfill tomorrow
 */

var Models  = require('../../../models');
var utils   = require('../../../utils');
var config  = require('../../../config');
var views   = require('../lib/views');

module.exports.name = 'Restaurant Tomorrow Orders';

module.exports.schema = {
  lastNotified: true
};

function notifyOrder( order ){
  return utils.partial( utils.async.parallel, {
    email: function( done ){
      utils.sendMail2({
        to:       order.attributes.emails
      , from:     config.emails.orders

      , html:     views.order_reminder({
                    config: config
                  , order: order.toJSON()
                  })

      , subject:  [
                    'Goodybag Reminder: Order #'
                  , order.attributes.id
                  , ' to be delivered tomorrow'
                  ].join('')
      }, done );
    }
  });
};

module.exports.check = function( storage, callback ){
  var $query = {
    where: { status: 'accepted' }
  };

  Models.Order.findTomorrow( function( error, results ){
    if ( error ) return callback( error );

    // Filter out restaurants that have already been notified
    results = results.filter( function( result ){
      if ( !storage.lastNotified[ result.attributes.id ] ) return true;

      var notified = storage.lastNotified[ result.attributes.id ];
      notified = new Date( notified );

      if ( notified == 'Invalid Date' ) return true;

      var today = new Date();
      today.setHours( 0, 0, 0, 0 );

      return today > notified;
    });

    return callback( null, results.length > 0 );
  });
};

module.exports.work = function( storage, callback ){
  var stats = {
    restaurantsNotified:  { text: 'Restaurants Notified', value: 0 }
  , peopleNotified:       { text: 'People Notified', value: 0 }
  , ordersHandled:        { text: 'Orders Handled', value: 0 }
  };

  var $query = {
    columns:  [
      '*'
    , 'restaurants.emails'
    , 'restaurants.sms_phones'
    , 'restaurants.voice_phones'
    ]
  , where: { status: 'accepted' }
  , joins: []
  };

  $query.joins.push({
    type: 'left'
  , target: 'restaurants'
  , on: {
      id: '$orders.restaurant_id$'
    }
  });

  Models.Order.findTomorrow( $query, function( error, orders ){
    if ( error ) return callback( error );

    stats.ordersHandled.value = orders.length;

    utils.async.parallel(
      orders.map( notifyOrder )
    , utils.partial( callback, null, stats )
    );

    return callback( null, stats );
  });
};