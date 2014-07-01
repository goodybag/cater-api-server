/**
 * Order Notifications
 */

var config      = require('../../config');
var utils       = require('../../utils');
var notifier    = require('../../lib/order-notifier');
var Models      = require('../../models');
var errors      = require('../../errors');
var db          = require('../../db');
var venter      = require('../../lib/venter');
var rLogger     = require('../../logger').routes;

// Copy the routes logger interface, but with make a new version
// of each level function with local tags built in
var logger = {};
var loggerTags = ['Orders', 'Order Notifcations'];
[ 'debug', 'info', 'warn', 'error' ].forEach( function( level ){
  logger[ level ] = rLogger[ level ].bind( rLogger, loggerTags );
});

var getEmailUrl = function( oid, nid ){
  return [
    config.baseUrl, 'orders', oid, 'notifications', nid
  ].join('/');
};

module.exports.JSON = {};

module.exports.JSON.list = function( req, res ){
  logger.info( 'Getting order notifications for order #' + req.param('oid') );

  db.orders.findOne( +req.param('oid'), function( error, order ){
    if ( error ){
      logger.error( 'Error getting order #' + req.param('oid'), error );
      return res.error( error );
    }

    var fns = Object.keys( notifier.defs ).map( function( nid ){
      return function( done ){
        notifier.getNotification( nid, order, { render: false }, function( error, result ){
          if ( error ) return done( error );

          var def = utils.clone( notifier.defs[ nid ] );

          def.email = result;
          def.email.url = getEmailUrl( req.param('oid'), def.id );

          return done( null, def );
        });
      };
    });

    utils.async.parallel( fns, function( error, results ){
      if ( error ){
        logger.error( 'Error getting order notifications for order #' + req.param('oid'), error );
        return res.error( error );
      }

      res.json( results );
    });
  });
};

module.exports.JSON.sendNotification = function( req, res ){
  logger.info( ['Sending notification', req.param('id'), ' for order #', req.param('oid') ].join('') );

  var notification = notifier.defs[ req.param('id') ];

  if ( !notification ){
    return res.error( errors.internal.NOT_FOUND );
  }

  var options = {};
  if ( notification.requiredOptions ){
    for ( var i = 0, l = notification.requiredOptions.length; i < l; ++i ){
      if ( !req.param( notification.requiredOptions[i] ) ){
        return res.error( errors.internal.BAD_DATA, {
          message: 'Missing required property: `' + notification.requiredOptions[i] + '`'
        });
      }

      options[ notification.requiredOptions[i] ] = req.param( notification.requiredOptions[i] );
    }
  }

  notifier.send( req.param('id'), +req.param('oid'), options, function( error ){
    if ( error ) return res.error( error );
    return res.send(204);
  });
};

module.exports.JSON.history = function( req, res ){
  logger.info( 'Getting order notification history for order #' + req.param('oid') );

  utils.async.waterfall([
    // Prepare order model
    function( next ){
      var $options = {
        many: [ { table: 'order_items', alias: 'orderItems' } ]
      , one:  [ { table: 'restaurants', alias: 'restaurant' } ]
      };
      db.orders.findOne( +req.param('oid'), $options, function( error, order ){
        if ( error ){
          logger.error( 'Error getting order #' + req.param('oid'), error );
          return res.error( error );
        }
        return next( null, order );
      });
    }

    // Get order notifications
  , function( order, next ){
      var $where = { order_id: +req.param('oid') };
      var options = { order: { send_date: 'desc' } };

      db.order_notifications.find( $where, options, function( error, notes ){
        if ( error ){
          logger.error( 'Error getting order notifications for order #' + req.param('oid'), error );
          return res.error( error );
        }

        notes = notes.map( function( note ){
          note.email.url = getEmailUrl( req.param('oid'), note.nid );
          return utils.extend( note, utils.omit( notifier.defs[ note.nid ], 'id' ) );
        });

        return res.json( notes );
      });
    }
  ]);
};

module.exports.JSON.historyItem = function( req, res ){
  logger.info( 'Getting order notification history for order #' + req.param('oid') );

  db.order_notifications.findOne( +req.param('id'), function( error, note ){
    if ( error ){
      return res.error( error );
    }

    utils.extend( note, utils.omit( notifier.defs[ note.nid ], 'fn', 'id' ) );

    res.json( note );
  });
};

module.exports.getEmail = function( req, res ){
  logger.info( 'Getting order notification email' + req.param('nid') + ' for order #' + req.param('oid') );

  var notification = notifier.defs[ req.param('nid') ];

  if ( !notification ){
    return res.error( errors.internal.NOT_FOUND );
  }

  var options = {};
  if ( notification.requiredOptions ){
    for ( var i = 0, l = notification.requiredOptions.length; i < l; ++i ){
      if ( !req.param( notification.requiredOptions[i] ) ){
        return res.error( errors.internal.BAD_DATA, {
          message: 'Missing required property: `' + notification.requiredOptions[i] + '`'
        });
      }

      options[ notification.requiredOptions[i] ] = req.param( notification.requiredOptions[i] );
    }
  }

  notifier.getNotification( req.param('nid'), +req.param('oid'), options, function( error, result ){
    if ( error ){
      logger.error( 'Error getting notfication ' + req.param('nid') + ' for order #' + req.param('oid'), error );
      return res.error( error );
    }

    for ( var key in result ){
      if ( key === 'html' ) continue;
      res.header( key, result[ key ] );
    }

    res.send( result.html );
  });
};