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

module.exports.send = utils.overload({
  default: function(){
    throw new Error('Must supply a valid Notification Name and Order/orderId');
  }

, 'String,Number,Function':
  function( id, orderId, callback ){
    if ( !(id in module.exports.defs) ){
      throw new Error( 'No matching notification: ' + id );
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

      return module.exports.send( id, order, callback );
    });
  }

, 'String,Order,Function':
  function( id, order, callback ){
    if ( !(id in module.exports.defs) ){
      throw new Error( 'No matching notification: ' + id );
    }

    var notifications = module.exports.defs[ id ];

    order.getOrderItems( function( error ){
      if ( error ){
        return callback( error );
      }

      var onNotification = function( notification, done ){
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
              logger.error( 'Error sending notification', {
                error: error
              , email: email
              });
            }

            return done();
          });
        });
      };

      utils.async.each( notifications, onNotification, function( error ){
        if ( error ){
          logger.error( 'Error sending notifications', { error: error });
        }

        return callback( error );
      });
    });
  }

, 'String,Order':
  function( id, order ){
    return module.exports.send( id, order, utils.noop );
  }

, 'String,Number':
  function( id, orderId ){
    return module.exports.send( id, orderId, utils.noop );
  }
});

module.exports.register = function( def ){
  if ( !def.id )  throw new Error('Must provide def.id string');
  if ( !def.name )  throw new Error('Must provide def.name string');
  if ( !def.build ) throw new Error('Must provide def.build function');

  def.cid = cid++;

  if ( module.exports[ def.id ] ){
    logger.warn( 'Setting order-notification: ' + def.id ' after already setting', def );
  }

  module.exports[ def.id ] = def;

  return def.cid;
};