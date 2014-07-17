/**
 * OrdrIn User Module
 */

var EventEmitter  = require('events').EventEmitter;
var ordrin        = require('ordrin-api');
var config        = require('../config');
var utils         = require('../utils');
var db            = require('../db');

ordrin = new ordrin.APIs( config.ordrin.apiKeyPrivate );

module.exports.generateToken = function(){
  return utils.uuid();
};

module.exports.register = utils.overload({
  'Number,Function':
  function( user_id, callback ){
    db.users.findOne( user_id, function( error, user ){
      if ( error ) return callback( error );

      return module.exports.register( user, callback );
    });
  }

, 'Object,Function':
  function( user, callback ){
    var this_ = this;

    var $update = {
      ordrin_email:     config.ordrin.emailFormat.replace( '{id}', user.id )
    , ordrin_password:  this.generateToken()
    };

    utils.async.parallel([
      db.users.update.bind( db.users, user.id, $update, { returning: ['*'] } )
    , ordrin.create_account.bind( ordrin, {
        email:      $update.ordrin_email
      , pw:         $update.ordrin_password
      , first_name: 'Goody'
      , last_name:  'Bag'
      })
    ], function( error, results ){
      if ( error ) return callback( error );

      user = results[0][0];

      this_.emit( 'user:registered', user );
      this_.emit( 'user:' + user.id + ':registered', user );

      callback( null, user );
    });
  }
}, module.exports );

module.exports = Object.create(
  utils.extend( module.exports, EventEmitter.prototype )
);

EventEmitter.call( module.exports );