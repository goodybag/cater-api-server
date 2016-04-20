/**
 * Reads all notifications in the notifications directory and
 * assigns them IDs and names if needed. Also provides an
 * interface for lookup by `id`
 */

var fs          = require('fs');
var path        = require('path');
var db          = require('../../db');
var errors      = require('../../errors');
var utils       = require('../../utils');
var definition  = require('./notification');
var Renderer    = require('../../lib/template-renderer');

var viewsDir = __dirname + '/../../views';

var templates = Renderer.create({
  engine:         Renderer.Engines.Handlebars.create({
                    viewDirectory:  viewsDir
                  , partialsDir:    __dirname + '/../../public/partials'
                  })
, viewDirectory:  viewsDir
});

// Hash notifications by their ID
var registry = {};

// Export convenience factories
module.exports.notification = require('./notification');
module.exports.email        = require('./email');
module.exports.sms          = require('./sms');
module.exports.voice        = require('./voice');

// Require all order notification definitions
var notificationsDir = path.join( __dirname, './notifications' );

fs.readdirSync( notificationsDir )
  .filter( function( f ){
    return fs.statSync( path.join( notificationsDir, f ) ).isFile();
  })
  .filter( function( f ){
    return f.slice(-3) === '.js';
  })
  .map( function( f ){
    return f.slice( 0, -3 );
  })
  .forEach( function( f ){
    var notification = require( path.join( notificationsDir, f ) );

    // No id? Just use the filename
    if ( !notification.id ){
      notification.id = f;
    }

    // No name? Use the file name, but replace `-` with ` ` and uppercase
    if ( !notification.name ){
      notification.name = f.split('-')
                            .map( function( str ){
                              return str[0].toUpperCase() + str.substring(1);
                            })
                            .join(' ');
    }

    // Name to use by reference -
    // Name: 'User Order Accepted'
    // refName: 'UserOrderAccepted'
    var refName = notification.name.replace(/\s+/g, '');

    notification = definition( notification );


    registry[ notification.id ] = module.exports[ refName ] = notification;
  });

/**
 * Get notification by id. If not ID is passed in
 * return all notifications hashed by ID
 * @param  {String} id ID of the notification
 * @return {Object}    The notification factory and definition
 */
module.exports.get = function( id ){
  if ( !id ) return registry;

  if ( !(id in registry) ){
    throw new Error('Cannot find notification id: ' + id);
  }

  return registry[ id ];
};

module.exports.has = function( id ){
  return id in registry;
}

// Implement functions requiring the database
definition.notificationProto.fetchOrder = function( callback ){
  db.orders.findOne( this.order.id, definition.orderQueryOptions, function( error, order ){
    if ( error ) return callback( error );

    if ( !order ){
      return callback( errors.internal.NOT_FOUND );
    }

    this.order = order;

    callback( null, order );
  }.bind( this ));

  return this;
};

definition.notificationProto.save = function( build, callback ){
  db.order_notifications.insert({
    nid:      this.def.id
  , user_id:  this.userId
  , order_id: this.order.id
  , data:     utils.omit( build, 'html' )
  }, callback );
};

definition.notificationProto.templates = templates;
