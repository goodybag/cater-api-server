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

module.exports = Object.create( Emitter.prototype );

module.exports.defs = {};

utils.overload.registerType({
  name: 'OrderWithItems'
, inherits: 'Order'
, def: function( order ){
    return Array.isArray( order.items );
  }
});

module.exports.send = utils.overload({
  default: function(){
    throw new Error('Must supply a valid Notification Name and Order/orderId');
  }

, 'String,Number,Function':
  function( name, orderId, callback ){
    if ( !(name in module.exports.defs) ){
      throw new Error( 'No matching notification: ' + name );
    }

    Models.findOne( orderId, function( error, order ){
      if ( error ){
        logger.error( 'Error fetching order', { orderId: orderId, error: error } );
        return callback( error );
      }

      if ( !order ){
        logger.error( 'Could not find orderId', { orderId: orderId } );
        return callback( errors.internal.NOT_FOUND );
      }

      return module.exports.send( name, order, callback );
    });
  }

, 'String,Order,Function':
  function( name, order, callback ){
    if ( !(name in module.exports.defs) ){
      throw new Error( 'No matching notification: ' + name );
    }

    var notifications = module.exports.defs[ name ];

    order.getOrderItems( function( error ){
      if ( error ){
        return callback( error );
      }

      var onNotification = function( notification, callback ){
        notification.build( order, logger, function( error, email ){
          if ( error ){
            logger.error( 'Error running notification builder', {
              error: error
            , email: email
            });
          }

          var tasks = {
            sendMail:     utils.sendMail2.bind( null, email )
          , saveRecord:   db.order_notifications.insert.bind( db.order_notifications, {
                            order_id: order.attributes.id
                          , email:    email
                          })
          };

          utils.parallel( tasks, function( error, results ){
            if ( error ){

            }
          });
        });
      };

      utils.async.each( notifications, onNotification, function( error ){

      });
    });
  }

, 'String,Order':
  function( name, order ){
    return module.exports.send( name, order, utils.noop );
  }

, 'String,Number':
  function( name, orderId ){
    return module.exports.send( name, orderId, utils.noop );
  }
});

module.exports.register = function( def ){
  if ( typeof def !== 'object' ) throw new Error('Invalid notification definition');
  if ( !def.name ) throw new Error('Must provide def.name string');
  if ( !def.build ) throw new Error('Must provide def.build function');

  if ( !module.exports[ def.name ] ) module.exports[ def.name ] = [];

  module.exports[ def.name ].push( def );
};