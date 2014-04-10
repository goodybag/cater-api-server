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

require('../app');

[ 'debug', 'info', 'warn', 'error' ].forEach( function( level ){
  logger[ level ] = logger[ level ].bind( logger, loggerTags );
});

var cid = 1;

module.exports = Object.create( Emitter.prototype );

module.exports.defs = {};

module.exports.get

module.exports.getNotification = utils.overload({
  default: function(){
    throw new Error('Must supply a valid Notification ID and Order/orderId');
  }

, 'String,Number,Function':
  function( id, orderId, callback ){
    if ( !(id in module.exports.defs) ){
      logger.error( 'Could not find order-notification', { id: id } );
      return callback( errors.internal.NOT_FOUND );
    }

    Models.Order.findOne( orderId, function( error, order ){
      if ( error ){
        logger.error( 'Error fetching order', { orderId: orderId, error: error } );
        return callback( error );
      }

      if ( !order ){
        logger.error( 'Could not find orderId', { orderId: orderId } );
        return callback( errors.internal.NOT_FOUND );
      }

      return module.exports.getNotification( id, order, callback );
    });
  }

, 'String,Order,Function':
  function( id, order, callback ){
    if ( !(id in module.exports.defs) ){
      throw new Error( 'No matching notification: ' + id );
    }

    var notification = module.exports.defs[ id ];

    order.getOrderItems( function( error ){
      if ( error ){
        return callback( error );
      }

      notification.build( order, logger, function( error, email ){
        if ( error ){
          logger.error( 'Error running notification builder', {
            error: error
          , email: email
          });
        }

        return callback( error, email );
      });
    });
  }

, 'String,Order':
  function( id, order ){
    return module.exports.getNotification( id, order, utils.noop );
  }

, 'String,Number':
  function( id, orderId ){
    return module.exports.getNotification( id, orderId, utils.noop );
  }
});

module.exports.send = function( id, order, callback ){
  callback = callback || utils.noop;

  module.exports.getNotification( id, order, function( error, email ){
    var tasks = {
      sendMail:     utils.sendMail2.bind( null, email )
    , saveRecord:   db.order_notifications.insert.bind( db.order_notifications, {
                      order_id: order instanceof Models.Order ? order.attributes.id : order
                    , email:    email
                    })
    };

    utils.async.parallel( tasks, function( error, results ){
      if ( error ){
        logger.error( 'Error sending notification', {
          error: error
        , email: email
        });
      }

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

  return def.cid;
};