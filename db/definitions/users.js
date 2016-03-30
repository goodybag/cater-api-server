/**
 * Users Schema
 */

if (typeof module === 'object' && typeof define !== 'function') {
  var define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

var dirac = require('dirac');
var utils = require('utils');
var types = require('../data-types');

define(function(require) {
  var definition = {};
  definition.name = 'users';

  definition.schema = {
    id: {
      type: types.serial
    , pk: true
    }
  , created_at: {
      type: types.timestamptz
    , nullable: false
    , default: 'NOW()'
    }
  , name: {
      type: types.text
    , nullable: true
    }
  , email: {
      type: types.text
    , nullable: false
    , unique: true
    }
  , password: {
      type: types.text
    , nullable: false
    }
  , organization: {
      type: types.text
    , nullable: true
    }
  , organization_type: {
      type: types.text
    , nullable: true
    , default: null
    }
  , balanced_customer_uri: { //can be null if they're going to be invoiced
      type: types.text
    , nullable: true
    , unique: true
    }
  , is_invoiced: {
      type: types.boolean
    , nullable: false
    , default: 'false'
    }
  , is_tax_exempt: {
      type: types.boolean
    , nullable: false
    , default: 'false'
    }
  , tax_exempt_id: { type: types.text }
  , receives_promos: {
      type: types.boolean
    , nullable: false
    , default: 'true'
    }
  , points: {
      type: types.int
    , checks: [ '>= 0']
    , default: 0
    }
  , region_id: {
      type: types.int
    , references: {table: 'regions', column: 'id', onDelete: 'set null'}
    }
  , default_zip: {
      type: types.varchar(5)
    }
  , ordrin_email:     { type: types.text, unique: true }
  , ordrin_password:  { type: types.text }
  , user_agent:       { type: types.text }
  , stripe_id:        { type: types.text }
  , is_deleted:       { type: types.boolean, nullable: false, default: 'false' }

    // The percentage menu pricing increases by for this Priority Account
    // We should deprecate this in the future for a proper `user_plans` concept
  , priority_account_price_hike_percentage: {
      type: types.numeric( 5, 5 )
    , notNull: true
    , default: 0
    }
  };

  definition.indices = {};

  definition.update = function update( $where, $update, options, callback ){
    // We should standardize this upstream with a convenience method
    if ( typeof options == 'function' ){
      callback = options;
      options = {};
    }

    if ( typeof $where != 'object' ) $where = { id: $where };

    if ( !$where.id ) return this._super( $where, $update, options, callback );
    if ( !Array.isArray( $update.courier_preferences ) ) return this._super( $where, $update, options, callback );

    var updateWithoutPrefs = utils.omit( $update, 'courier_preferences' );

    var tx = this.client || dirac.tx.create();
    var result;

    utils.async.series([
      this.client ? utils.async.noop : tx.begin.bind( tx )
    , Object.keys( updateWithoutPrefs ).length > 0
      ? function( next ){
          tx.users.update( $where, updateWithoutPrefs, options, function( error, user ){
            if ( error ) return next( error );

            result = user[0];
            result.courier_preferences = $update.courier_preferences;

            return next();
          });
        }
      : utils.async.noop
    , tx.user_courier_preferences.save.bind(
        tx.user_courier_preferences, $where.id, $update.courier_preferences
      )
    , this.client ? utils.async.noop : tx.commit.bind( tx )
    ], function( error ){
      if ( error ){
        if ( this.client ){
          return callback( error );
        }

        return tx.rollback( function(){
          return callback( error );
        });
      }

      return callback( null, [ result ] );
    }.bind( this ));
  };

  definition.insert = function( $doc, options, callback ){
    // We should standardize this upstream with a convenience method
    if ( typeof options == 'function' ){
      callback = options;
      options = {};
    }

    if ( !Array.isArray( $doc.courier_preferences ) ) return this._super( $doc, options, callback );

    var courier_preferences = $doc.courier_preferences;
    delete $doc.courier_preferences;

    if ( courier_preferences.length === 0 ) return this._super( $doc, options, callback );

    var tx = this.client || dirac.tx.create();

    utils.async.waterfall([
      // Begin
      function( next ){
        if ( this.client ){
          return tx.begin( function( error ){
            return next( error );
          });
        }

        return next();
      }.bind( this )

    , function( next ){
        tx.users.insert( $doc, options, next );
      }

    , function( user, next ){
        tx.user_courier_preferences.save( user.id, courier_preferences, function( error ){
          if ( error ) return next( error );

          user.courier_preferences = courier_preferences;

          return next( null, user );
        });
      }

      // Commit
    , function( user, next ){
        if ( this.client ){
          return tx.commit( function( error ){
            return next( error, user );
          });
        }

        return next( null, user );
      }.bind( this )

    , function( user, next ){
        return callback( null, user );
      }
    ], function( error ){
      if ( error ){
        if ( this.client ){
          return callback( error );
        }

        return tx.rollback( function(){
          return callback( error );
        });
      }
    }.bind( this ));
  };

  return definition;
});
