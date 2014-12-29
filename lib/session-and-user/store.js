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

    console.log('dal', options.dal);

    this.options = options;
  }

  Object.defineProperty( Store.prototype, 'dal', {
    get: function(){
      return db[ this.options.dal.name ];
    }
  });

  Store.prototype.get = function( sid, callback ){
    var $query = {
      sid: sid
    , expires_at: { $gt: new Date() }
    };
console.log($query, this.options.queryOptions);
    this.dal.findOne( $query, this.options.queryOptions, function( error, result ){
      if ( error || !result ) return callback( error );
console.log(result);
      result.data.user = result.user;

      return callback( null, result.data );
    });
  };

  Store.prototype.set = function( sid, data, callback ){
    var $where = { sid: sid };

    var $update = {
      sid:        sid
    , data:       data
    , expires_at: data.cookie._expires
    };

    if ( data.user && data.user.id ){
      $update.user_id = data.user.id;
    }

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