/**
 * Store
 */

var util  = require('util');
var db    = require('../../db');

module.exports = function( session ){
  util.inherits( Store, session.Store );

  function Store( options ){
    if ( !options.dal ){
      throw new Error('Missing required option: `dal`');
    }

    this.options = options;
  }

  Object.defineProperty( Store.prototype, 'dal', {
    get: function(){
      return db[ this.options.dal.name ];
    }
  });

  Store.prototype.get = function( sid, callback ){
    this.options.queryOptions.joins = [
      { type: 'left', target: 'users', on: { id: '$dirac_session.user_id$' } }
    ];

    var $query = {
      sid: sid
    , expires_at: { $gt: new Date() }
    , 'users.is_deleted': false
    };

    this.dal.findOne( $query, this.options.queryOptions, function( error, result ){
      if ( error || !result ) return callback( error );

      result.data.canonical = result.user;

      return callback( null, result.data );
    });
  };

  Store.prototype.set = function( sid, data, callback ){
    var $where = { sid: sid };

    var $update = {
      sid:        sid
    , data:       data
    , expires_at: data.cookie._expires
    , user_id:    data.user ? data.user.id : null
    };

    var options = { returning: ['*'] };

    this.dal.update( $where, $update, options, function( error, results ){
      if ( error ) return callback( error );

      if ( Array.isArray( results ) && results[0] ) return callback();

      this.dal.insert( $update, function( error, result ){
        if ( error ) return callback( error );

        callback();
      });
    }.bind( this ));
  };

  Store.prototype.destroy = function( sid, callback ){
    this.dal.remove( { sid: sid }, callback );
  };

  return Store;
};
