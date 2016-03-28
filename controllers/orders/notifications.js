/**
 * Order Notifications
 */

var config      = require('../../config');
var utils       = require('../../utils');
var notifier    = require('../../lib/order-notifier');
var Models      = require('../../models');
var errors      = require('../../errors');
var db          = require('../../db');
var errors      = require('../../errors');
var venter      = require('../../lib/venter');
var notifications2 = require('../../lib/order-notifications2');

// Notifications we'll try to pull from 2
// Function is the build coercion function
var notifications2Notifications = {
  'dropoff-order-submitted': function( build, req ){
    build.email = {
      from:     'Goodybag'
    , to:       'dropoff.com'
    , subject:  build.name
    , url:      getEmailUrl( req.params.oid, 'dropoff-order-submitted' )
    };
  }
};

var getEmailUrl = function( oid, nid ){
  return [
    config.baseUrl, 'orders', oid, 'notifications', nid
  ].join('/');
};

// Order query options
var $ordersOptions = require('../../lib/order-notifications2/notification').orderQueryOptions;

/**
 * Gets the HTTP error for a notification/option combo if it exists
 * Otherwise, returns false
 * @param  {Object}   notification The notification
 * @param  {Object}   options      The parsed options
 * @return {Mixed}                 Error or false
 */
var getNotificationError = function( notification, options ){
  if ( !Array.isArray( notification.requiredOptions ) ) return false;

  // Filter down to keys that are null/undefined in options obj
  var missing = notification.requiredOptions.filter( function( k ){
    return ~[ null, undefined ].indexOf( options[ k ] );
  });

  if ( !missing.length ) return false;

  return utils.extend( {}, errors.internal.BAD_DATA, {
    message: 'Missing required properties'
  , details: missing
  });
};

var getNotificationDef = function( id ){
  try {
    return notifications2.get( id );
  } catch( e ){
    return notifier.defs[ id ];
  }
};

module.exports.JSON = {};

module.exports.JSON.list = function( req, res ){
  var logger = req.logger.create('Controller-Notifications');

  logger.info( 'Getting order notifications for order #' + req.params.oid );

  db.orders.findOne( +req.params.oid, $ordersOptions, function( error, order ){
    if ( error ){
      logger.error( 'Error getting order #' + req.params.oid, error );
      return res.error( error );
    }

    var fns = Object.keys(
      notifier.defs
    // Filter out notifications that do not apply to the order
    ).filter( function( nid ){
      var def = notifier.defs[ nid ];

      if ( typeof def.isAvailable !== 'function' ) return true;

      return def.isAvailable( order );
    }).map( function( nid ){
      return function( done ){
        notifier.getNotification( nid, order, { render: false }, function( error, result ){
          if ( error === errors.notifications.NOT_AVAILABLE ){
            return done();
          }

          if ( error ) return done( error );

          var def = utils.clone( notifier.defs[ nid ] );

          def.email = result;
          def.email.url = getEmailUrl( req.params.oid, def.id );

          return done( null, def );
        });
      };
    });

    // For now, manually push Dropoff notification type since we
    // haven't fully migrated to notifications2
    Object.keys( notifications2Notifications ).forEach( function( id ){
      var note = notifications2
        .get( id )
        .create( order, req.user.attributes.id );

      if ( !note.isAvailable( order ) ){
        return;
      }

      fns.push( function( done ){
        note.build( function( error, build ){
          if ( error ){
            logger.warn('Error building notification', {
              error: error
            , notification: note
            });

            return done();
          }

          // Coerce to legacy structure
          build.cid = Math.random().toString(36);
          notifications2Notifications[ id ]( build, req );

          done( null, build );
        });
      });
    });

    utils.async.parallel( fns, function( error, results ){
      if ( error ){
        logger.error( 'Error getting order notifications for order #' + req.params.oid, error );
        return res.error( error );
      }

      res.json( results.filter( v => !!v ) );
    });
  });
};

module.exports.JSON.sendNotification = function( req, res ){
  var logger = req.logger.create('Controller-Notifications');

  logger.info( ['Sending notification', req.params.id, ' for order #', req.params.oid ].join('') );

  var onSend = function( error ){
    if ( error ) return res.error( error );
    return res.send(204);
  };

  if ( req.params.id in notifications2Notifications ){
    return notifications2
      .get( req.params.id )
      .create( +req.params.oid, req.user.attributes.id, req.query )
      // NOTE:
      // This send handler is duplicated in:
      //    workers/scheduler/actions/notify-delivery-service.js
      // If you change something here, be sure to check out that file
      // TODO: Fix this situation
      .send( function( error, result ){
        if ( error ){
          return onSend( error );
        }

        if ( req.params.id !== 'dropoff-order-submitted' ){
          return onSend( null, result );
        }

        // Dropoff Order Submitted should also update the
        // order's courier_tracking_id
        db.orders.update( req.params.oid, { courier_tracking_id: result.data.url }, onSend );
      });
  }

  var notification = notifier.defs[ req.params.id ];

  if ( !notification ){
    return res.error( errors.internal.NOT_FOUND );
  }

  var options = utils.extend(
    utils.pick( req.query, notification.requiredOptions || [] )
  , utils.pick( req.query, notification.options         || [] )
  );

  var error = getNotificationError( notification, options );

  if ( error ) return res.error( error );

  notifier.send( req.params.id, +req.params.oid, options, onSend );
};

module.exports.JSON.history = function( req, res ){
  var logger = req.logger.create('Controller-Notifications');

  logger.info( 'Getting order notification history for order #' + req.params.oid );

  utils.async.waterfall([
    // Prepare order model
    function( next ){
      db.orders.findOne( +req.params.oid, $ordersOptions, function( error, order ){
        if ( error ){
          logger.error( 'Error getting order #' + req.params.oid, error );
          return res.error( error );
        }
        return next( null, order );
      });
    }

    // Get order notifications
  , function( order, next ){
      var $where = { order_id: +req.params.oid };
      var options = { order: { send_date: 'desc' } };

      db.order_notifications.find( $where, options, function( error, notes ){
        if ( error ){
          logger.error( 'Error getting order notifications for order #' + req.params.oid, error );
          return res.error( error );
        }

        notes = notes.map( function( note ){
          note.data.url = getEmailUrl( req.params.oid, note.nid );

          // Embed timezone information so the client can adjust
          note.send_date = new Date( note.send_date );

          var def = getNotificationDef( note.nid );
          note.data_html = '';

          if ( def.historyDataHTML ){
            note.data_html = def.historyDataHTML( note );
          }

          return utils.extend( note, utils.omit( def, 'id' ) );
        });

        return res.json( notes );
      });
    }
  ]);
};

module.exports.JSON.historyItem = function( req, res ){
  var logger = req.logger.create('Controller-Notifications');

  logger.info( 'Getting order notification history for order #' + req.params.oid );

  db.order_notifications.findOne( +req.params.id, function( error, note ){
    if ( error ){
      return res.error( error );
    }

    utils.extend( note, utils.omit( notifier.defs[ note.nid ], 'fn', 'id' ) );

    res.json( note );
  });
};

module.exports.getEmail = function( req, res ){
  var logger = req.logger.create('Controller-Notifications');

  logger.info( 'Getting order notification email ' + req.params.nid + ' for order #' + req.params.oid );

  function onBuild( error, result ){
    if ( error ){
      logger.error( 'Error getting notfication ' + req.params.nid + ' for order #' + req.params.oid, error );
      return res.error( error );
    }

    res.send( result.html );
  }

  if ( req.params.nid in notifications2Notifications ){
    return notifications2
      .get( req.params.nid )
      .create( +req.params.oid, req.user.attributes.id, req.query )
      .build( onBuild );
  }

  var notification = notifier.defs[ req.params.nid ];

  if ( !notification ){
    return res.error( errors.internal.NOT_FOUND );
  }

  var options = utils.extend(
    utils.pick( req.query, notification.requiredOptions || [] )
  , utils.pick( req.query, notification.options         || [] )
  );

  var error = getNotificationError( notification, options );

  if ( error ) return res.error( error );

  notifier.getNotification( req.params.nid, +req.params.oid, options, onBuild );
};
