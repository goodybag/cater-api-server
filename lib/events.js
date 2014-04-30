var path      = require('path');
<<<<<<< HEAD
=======
var moment    = require('moment-timezone');

>>>>>>> master
var config    = require('../config');
var logger    = require('../logger');
var venter    = require('./venter');
var receipt   = require('./receipt');
var utils     = require('../utils');
var app       = require('../app');
var pms       = require('./pms');
var helpers   = require('../public/js/lib/hb-helpers');
var welcome   = require('./welcome-emailer');
<<<<<<< HEAD
var notifier  = require('./order-notifier');
=======
var scheduler = require('./scheduler');
>>>>>>> master

var receiptPath = path.resolve( __dirname, '../', config.receipt.dir );

var receiptEvents = {
  // When the order changes, re-build the receipt PDF
  'order:change':
  function( orderId ){
    receipt.build( orderId, function( error ){
      if ( error ) logger.events.error( "Error building receipt", orderId, error );
    });
  }

  // When the order status changes, send the client an email
  // When the order status changes to delivered, send the client an
  // email with the PDF receipt attached
, 'order:status:change':
  function( order, previous ){
    var emailStatuses = [ 'submitted', 'accepted', 'denied' ];
    var orderId       = order.attributes.id;
    var statusText    = order.attributes.status;

    if ( !utils.contains( emailStatuses, statusText ) ) return;

    // Rebuild receipt
    receipt.build( orderId, function( error ){
      if ( error ) logger.events.error( "Error building receipt", orderId, error );
    });

    order.getOrderItems( function( error, items ){
      if ( error ){
        return logger.events.error( 'Error getting order items', error );
      }

      order.attributes.orderItems = items;

      notifier.send( 'user-order-' + statusText, order );
    });
  }
};

// Handle restaurant submitted orders
var restaurantSubmittedOrders = {
  'order:status:change':
  function( order, previous ){
    var orderId = order.attributes.id;
    var statusText = order.attributes.status;

    if ( statusText !== 'submitted' ) return;

    // Just in case, re-build the receipt even though other events probably
    // dispatched the same request. It doesn't matter though because the async
    // queue will take care of any duplicate jobs
    receipt.build( orderId, function( error ){
      if ( error ) logger.events.error( "Error building receipt", orderId, error );
    });

    order.getOrderItems( function( error, items ){
      if ( error ){
        return logger.events.error( 'Error getting order items', error );
      }

      order.attributes.orderItems = items;

      notifier.send( 'restaurant-order-submitted', order );
    });
  }
};

var jukebox = {
  'order:status:change':
  function( order ){
    if ( config.env !== 'production' ) return;
    if ( order.attributes.status !== 'accepted' ) return;
    if (
      order.attributes.user && typeof order.attributes.user.email === 'string' &&
      order.attributes.user.email.indexOf('@goodybag.com') > -1
    ) return;

    utils.post('http://gb-prod-alert.j0.hn/deployments/accepted', order.toJSON());
  }
};

// Send client and restaurant an email about canceled orders
var clientRestaurantCanceledOrders = {
  'order:status:change': function( order, previous ){
    var orderId    = order.attributes.id;
    var statusText = order.attributes.status;

    // Only respond to canceled orders that were submitted or accepted
    if ( statusText !== 'canceled' ) return;
    if ( ['submitted', 'accepted'].indexOf( previous ) === - 1 ) return

    order.getOrderItems( function( error, items ){
      if ( error ){
        return logger.events.error( 'Error getting order items', error );
      }

      order.attributes.orderItems = items;

      notifier.send( 'user-order-canceled', order );
      notifier.send( 'restaurant-order-canceled', order );
      notifier.send( 'goodybaggers-order-canceled', order );
    });
  }
};

var pmsEvents = {
  'payment-summary:change':
  function( psid, psrid ){
    pms.build( psid, psrid );
  }
};

var welcomes = {
  // Send welcome email
  'user:registered':
  function( user ){
    var time = new moment().tz( user.attributes.timezone || config.welcome.timezone );

    if ( !welcome.isValidTimeForUser( time, user ) ){
      time.set( 'hour', +config.welcome.beginTime.split(':')[0] );
      time.set( 'minute', +config.welcome.beginTime.split(':')[1] );
    }

    scheduler.enqueue( 'send-welcome-email-1', time.toDate(), user.toJSON() );
  }
};

var orderChanges = {
  'order:datetime:change':
  function( order, oldDatetime ){
    if ( order.attributes.status !== 'accepted' ) return;

    logger.events.info( 'order:datetime:change', order.attributes.datetime, oldDatetime );

    order.getOrderItems( function( error, items ){
      if ( error ) return logger.events.error( 'delivery-date-changed could not get order items', error );

      order.attributes.orderItems = items;

      notifier.send( 'restaurant-order-delivery-date-changed', order, { oldDatetime: oldDatetime } );
    });
  }
};

var rewards = {
  'reward:redeemed':
  function( reward, userId ){
    logger.points.info( 'Redemption', reward, userId );

    utils.sendMail2({
      to: config.emails.rewards
    , from: config.emails.info
    , subject: [ '[Rewards] User #', userId, ' just redeemed!' ].join('')
    , html: [
        '<a href="', config.baseUrl, '/users/', userId, '">User #', userId, '</a>'
      , ' just redeemed a giftcard.'
      , '<br>'
      , '<strong>Details:</strong><br>'
      , '<ul>'
      , '  <li>Location: ', reward.location, '</li>'
      , '  <li>Amount: $', helpers.dollars( reward.amount ), '</li>'
      , '  <li>Points: ', reward.cost, '</li>'
      , '</ul>'
      ].join('')
    }, function( error ){
      if ( error ) return logger.points.error( 'Error sending redemption email', error, reward, userId );
    });
  }
};

/**
 * Registers an event defined in obj onto venter.on( key )
 * Waits until nextTick
 * @param  {Object} obj The events object to read from
 * @param  {String} key The event name
 */
var registerEvent = function( obj, key ){
  venter.on( key, function(){
    var args = arguments;
    process.nextTick( function(){
      obj[ key ].apply( venter, args );
    });
  });
};

var registerEventGroup = function( group ){
  Object.keys( group ).forEach( utils.partial( registerEvent, group ) );
};

// Register all of events
registerEventGroup( receiptEvents );
registerEventGroup( restaurantSubmittedOrders );
registerEventGroup( clientRestaurantCanceledOrders );
registerEventGroup( jukebox );
registerEventGroup( pmsEvents );
registerEventGroup( welcomes );
registerEventGroup( orderChanges );
registerEventGroup( rewards );
