/**
 * Order Notifier
 */

var Emitter = require('events').EventEmitter;
var db      = require('../db');
var utils   = require('../utils');
var errors  = require('../errors');
var Models  = require('../models');
var logger  = require('../logger').orderNotifier;

var loggerTags = ['order-notifier'];

[ 'debug', 'info', 'warn', 'error' ].forEach( function( level ){
  logger[ level ] = logger[ level ].bind( logger, loggerTags );
});

var cid = 1;

module.exports = Object.create( Emitter.prototype );

module.exports.defs = {};

utils.overload.config({
  dataTypes: Models
});

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

    var $options = {
      many: [ { table: 'order_items', alias: 'orderItems' } ]
    , one:  [ { table: 'restaurants', alias: 'restaurant' }
            , { table: 'users', alias: 'user' }
            , { table: 'delivery_services', alias: 'deliveryService' }
            ]
    };

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

    var notification = module.exports.defs[ id ];

    notification.build.call( notification, order, logger, options, function( error, email ){
      if ( error ){
        logger.error( 'Error running notification builder', {
          error: error
        });
      }

      return callback( error, email );
    });

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

  module.exports.getNotification( id, order, options, function( error, email ){
    var orderId = order instanceof Object ? order.id : order;
    var tasks = {
      sendMail:     utils.sendMail2.bind( null, email )
    , saveRecord:   db.order_notifications.insert.bind( db.order_notifications, {
                      order_id: orderId
                    , email:    utils.omit( email, 'html' )
                    , nid:      id
                    })
    };

    utils.async.parallel( tasks, function( error, results ){
      if ( error ){
        logger.error( 'Error sending notification', {
          error: error
        , email: utils.omit( email, 'html' )
        });
      }
      module.exports.emit('send:' + id, orderId);
      return callback();
    });
  });
};

module.exports.register = function( def ){
  if ( !def.id )  throw new Error('Must provide def.id string');
  if ( !def.name )  throw new Error('Must provide def.name string');
  if ( !def.build ) throw new Error('Must provide def.build function');

  def.cid = cid++;

  utils.defaults( def, {
    type: 'uncategorized'
  , description: 'N/A'
  });

  if ( module.exports.defs[ def.id ] ){
    logger.warn( 'order-notification: ' + def.id + ' set twice!', def );
  }

  module.exports.defs[ def.id ] = def;

  module.exports.emit('register:' + def.id);
  return def.cid;
};