/**
 * OrdrIn User Module
 */

var EventEmitter  = require('events').EventEmitter;
var utils         = require('../utils');
var db            = require('../db');

module.exports.register = utils.overload({
  'Number,Function':
  function( user_id, callback ){
    db.findOne( user_id, function( error, user ){
      if ( error ) return callback( error );

      return module.exports.register( user, callback );
    });
  }

, 'Object,Function':
  function( user, callback ){

  }
}, module.exports );

module.exports = Object.create(
  utils.extend( module.exports, EventEmitter.prototype )
);

EventEmitter.call( module.exports );