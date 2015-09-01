/**
 * Addresses.DB
 * Model logic for interacting with the database
 *
 * Usage:
 *
 * var Addresses = require('stamps/addresses/user-addresses-db');
 * var GeocodeRequest = require('stamps/requests/geocode');
 * 
 * GeocodeRequest()
 *   .address('1900 Ullrich Ave., Austin, TX 78756')
 *   .send( function( error, result ){
 *     if ( error ){
 *       throw error;
 *     }
 * 
 *     var address = Addresses( result.toAddress() );
 *     address.is_default = true;
 *     address.user_id = 11;
 *     address.phone = '4693875077';
 *
 *     address.save( function( error, result ){
 *       if ( error ){
 *         throw error;
 *       }
 * 
 *       console.log( result );
 * 
 *       process.exit(0);
 *     });
 *   });
 */

var db = require('db');
var utils = require('utils');
var errors = require('errors');
var logger = require('../../../../../lib/logger');

module.exports = require('stampit')()
  .compose( require('./base') )
  .enclose( function(){
    this.setLogger( logger );
  })
  .methods({
    setLogger: function( logger ){
      Object.defineProperty( this, 'logger', {
        value: logger.create('UserAddressesDB', {
          data: {
            address: this
          }
        })
      , configurable: true
      , enumerable: false
      });

      return this;
    }

  , getUserDefaultAddressQuery: function(){
      return {
        user_id:    this.user_id
      , is_default: true
      };
    }

  , save: function( callback ){
      if ( this.id ){
        this.saveExisting( callback );
      } else {
        this.saveNew( callback );
      }

      return this;
    }

  , saveNew: function( callback ){
      if ( !this.hasMinimumComponents() ){
        return callback( errors.input.INVALID_ADDRESS );
      }

      var logger = this.logger;

      var addressLookup = this.getUserDefaultAddressQuery();

      var tx = db.dirac.tx.create();

      utils.async.waterfall([
        // Check if there was an existing default
        function( next ){
          db.addresses.findOne( addressLookup, function( error, result ){
            if ( error ){
              logger.warn('Error looking up address', {
                addressLookup: addressLookup
              , error: error
              });

              return next( error );
            }

            this.is_default = this.is_default || !result;

            return next();
          }.bind( this ));
        }.bind( this )

      , function( next ){
          tx.begin( function( error ){
            return next( error );
          });
        }

        // Update existing addresses with default false
        // and save the new address
      , function( next ){
          if ( this.is_default ){
            tx.addresses.update( addressLookup, { is_default: false } );
          }

          tx.addresses.insert( this, function( error, result ){
            if ( error ){
              logger.warn('Error inserting address', {
                error: error
              });
            }

            return next( error, result[0] );
          });
        }.bind( this )

        // Commit and extend the instance with the result
      , function( result, next ){
          tx.commit( function( error ){
            if ( error ){
              logger.warn('Error committing transaction', {
                error: error
              });

              return next( error );
            }

            utils.extend( this, result );

            return next();
          }.bind( this ));
        }.bind( this )
      ], function( error ){
        if ( error ){
          tx.rollback();
          return callback( error );
        }

        return callback( null, this );
      }.bind( this ));
    }

  , saveExisting: function( callback ){
      var logger = this.logger;
      var tx = db.dirac.tx.create();

      utils.async.waterfall([
        function( next ){
          tx.begin( function( error ){
            return next( error );
          });
        }.bind( this )

      , function( next ){
          if ( this.is_default ){
            tx.addresses.update( this.getUserDefaultAddressQuery(), { is_default: false } );
          }

          tx.addresses.update( this.id, this, { returning: ['*'] }, function( error, result ){
            if ( error ){
              logger.warn('Error updating address', {
                error: error
              });

              return next( error );
            }

            return next( null, result[0] );
          }.bind( this ));
        }.bind( this )

      , function( result, next ){
          tx.commit( function( error ){
            if ( error ){
              logger.warn('Error committing transaction', {
                error: error
              });

              return next( error );
            }

            utils.extend( this, result );

            return next();
          }.bind( this ));
        }.bind( this )
      ], function( error ){
        if ( error ){
          tx.rollback();
          return callback( error );
        }

        return callback( null, this );
      }.bind( this ));
    }
  });