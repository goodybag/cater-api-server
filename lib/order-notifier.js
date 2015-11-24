/**
 * Order Notifier
 */

var Emitter     = require('events').EventEmitter;
var db          = require('../db');
var utils       = require('../utils');
var errors      = require('../errors');
var Models      = require('../models');
var logger      = require('./logger').create('OrderNotifier');
var config      = require('../config');
var odsChecker  = require('../public/js/lib/order-delivery-service-checker');
var Order       = require('stamps/orders/base');
var cid = 1;

module.exports = Object.create( Emitter.prototype );

module.exports.defs = {};

utils.overload.config({
  dataTypes: Models
});

module.exports.$requiredOrderOptions = {
  many:   [ { table: 'order_items', alias: 'orderItems' }
          , { table: 'transaction_errors', alias: 'transaction_errors' }
          ]
, one:    [ { table: 'restaurants'
            , alias: 'restaurant'
            , many: [
                {
                  table: 'amenities'
                , alias: 'amenities'
                , columns: [
                    '*'
                  , {
                      type: 'exists'
                    , expression: {
                        type: 'select'
                      , columns: [ { expression: 1 } ]
                      , table: 'order_amenities'
                      , where: { order_id: '$orders.id$', amenity_id: '$amenities.id$' }
                      }
                    , alias: 'checked'
                    }
                  ]
                }
              , { table: 'contacts', alias: 'contacts', where: { notify: true } }
              ]
            , one: [{ table: 'regions', alias: 'region' }]
            }
          , { table: 'users', alias: 'user' }
          , { table: 'delivery_services', alias: 'deliveryService' }
          , { table: 'regions', alias: 'region', where: { id: '$restaurants.region_id$'} }
          , { table: 'restaurant_locations', alias: 'location' }
          ]
, joins:  [ { type: 'left', target: 'restaurants', on: { id: '$orders.restaurant_id$' } }
          ]
};

module.exports.getNotification = utils.overload({
  default2: function(){
    console.info( 'Arguments Supplied: ');
    for ( var key in arguments ) console.log('  * ' + typeof arguments[ key ] );
    throw new Error('Must supply a valid Notification ID and Order/orderId');
  }

, 'String,Number,Object,Function':
  function( id, orderId, options, callback ){
    if ( !(id in module.exports.defs) ){
      logger.error( 'Could not find order-notification', { id: id } );
      return callback( errors.internal.NOT_FOUND );
    }

    var $options = module.exports.$requiredOrderOptions;

    db.orders.findOne( orderId, $options, function (error, order) {
      if ( error ){
        logger.error( 'Error fetching order', { orderId: orderId, error: error } );
        return callback( error );
      }

      if ( !order ){
        logger.error( 'Could not find orderId', { orderId: orderId } );
        return callback( errors.internal.NOT_FOUND );
      }

      return module.exports.getNotification( id, order, options, callback );
    });
  }

, 'String,Object,Object,Function':
  function( id, order, options, callback ){
    if ( !(id in module.exports.defs) ){
      throw new Error( 'No matching notification: ' + id );
    }

    // Ensure the order has all the fields we need
    if ( !utils.hasPropsDeep( order, [
      'restaurant'
    , 'restaurant.contacts'
    , 'user'
    , 'deliveryService'
    , 'orderItems'
    , 'region'
    , 'location'
    ]) ){
      return module.exports.getNotification( id, +order.id, options, callback );
    }

    if ( order.type === 'courier' ){
      order.courierReasons = odsChecker.why( order );
    }

    var notification = module.exports.defs[ id ];

    var _logger = logger.create( id, {
      data: {
        notification: notification
      , order:        order
      , options:      options
      }
    });

    _logger.debug('Calling notification');

    if ( !notification.disablePriceHike ){
      Order.applyPriceHike( order );
    }

    try {
      notification.build.call( notification, order, _logger, options, function( error, email ){
        if ( error ){
          _logger.error( 'Error running notification builder', {
            error: error
          });
        }

        return callback( error, email );
      });
    } catch ( error ){
      _logger.error( 'Caught exception while building notification', error);
      return callback( error, null );
    }
  }

, 'String,Object,Function':
  function( id, order, callback ){
    return module.exports.getNotification( id, order, {}, callback );
  }

, 'String,Number,Function':
  function( id, order, callback ){
    return module.exports.getNotification( id, order, {}, callback );
  }

, 'String,Object,Object':
  function( id, order, options ){
    return module.exports.getNotification( id, order, options, utils.noop );
  }

, 'String,Number,Object':
  function( id, order, options ){
    return module.exports.getNotification( id, order, options, utils.noop );
  }

, 'String,Object':
  function( id, order ){
    return module.exports.getNotification( id, order, utils.noop );
  }

, 'String,Number':
  function( id, orderId ){
    return module.exports.getNotification( id, orderId, utils.noop );
  }
});

module.exports.send = function( id, order, options, callback ){
  if ( typeof options === 'function' ){
    callback = options;
    options = null;
  }

  callback = callback || utils.noop;
  options = options || {};

  var slogger = logger.create('Send', {
    data: { id: id, order: order, options: options }
  });

  slogger.debug('Getting notification');

  module.exports.getNotification( id, order, options, function( error, notification ){
    if ( error ){
      slogger.error( 'Error getting notification', error );
      return callback( error );
    }

    var orderId = order instanceof Object ? order.id : order;
    var tasks = {
      send:         module.exports.getSendFn(id, notification)
    , saveRecord:   db.order_notifications.insert.bind( db.order_notifications, {
                      order_id: orderId
                    , data:     utils.omit( notification, 'html' )
                    , nid:      id
                    })
    };

    utils.async.parallel( tasks, function( error, results ){
      if ( error ){
        slogger.error( 'Error sending notification', {
          error: error
        , email: utils.omit( notification, 'html' )
        });

        return callback( error );
      }

      module.exports.emit('send:' + id, orderId);

      slogger.debug('Success!');

      return callback();
    });
  });
};


// twilio only allows one number per api request.
// so this will asynchronously send sms requests per sms contact
// kind of crazy, but the good kind!
// note this will bail asap if one of the requests fail.
module.exports.sendSms = function(notification, callback) {
  var template = {
    from: notification.from
  , body: notification.html
  };

  var tasks = notification.to.map(function(sms_phone) {
    var sms = utils.extend({ to: sms_phone }, template);
    return utils.twilio.sendSms.bind(null, sms);
  });
  utils.async.parallel(tasks, callback);
}

// make a bunch of calls in parallel
module.exports.makeCall = function(notification, callback) {
  var template = {
    from: notification.from
  , url: notification.url
  , ifMachine: 'Continue'
  , method: 'GET'
  };

  var tasks = notification.to.map(function(voice_phone) {
    var call = utils.extend({ to: voice_phone }, template);
    return utils.twilio.makeCall.bind(null, call);
  });
  utils.async.parallel(tasks, callback);
};

// returns a function that handles sending the notification
// through different "format"s like voice, sms, or email
module.exports.getSendFn = function(id, notification) {
  var format = module.exports.defs[id].format;

  if ( format === 'email' ) {
    return utils.sendMail2.bind(null, notification);
  } else if ( format === 'sms' ) {
    return module.exports.sendSms.bind(null, notification);
  } else if ( format === 'voice' ) {
    return module.exports.makeCall.bind(null, notification);
  } else {
    slogger.error( 'Incorrect notification format', notification.format );
    return null;
  }
}

module.exports.register = function( def ){
  if ( !def.id )  throw new Error('Must provide def.id string');
  if ( !def.name )  throw new Error('Must provide def.name string');
  if ( !def.build ) throw new Error('Must provide def.build function');

  def.cid = cid++;

  utils.defaults( def, {
    type: 'uncategorized'
  , description: 'N/A'
  , format: 'email'
  });

  if ( module.exports.defs[ def.id ] ){
    logger.warn( 'order-notification: ' + def.id + ' set twice!', def );
  }

  module.exports.defs[ def.id ] = def;

  module.exports.emit('register:' + def.id);
  return def.cid;
};
