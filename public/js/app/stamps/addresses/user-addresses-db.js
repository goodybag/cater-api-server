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
        value: logger.create('UserAddressesDB')
      , configurable: false
      , enumerable: false
      });

      return this;
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

      var addressLookup = {
        user_id:    this.user_id
      , is_default: true
      };

      var tx = db.dirac.tx.create();

      utils.async.waterfall([
        // Check if there was an existing default
        function( next ){
          console.log('check existing address')
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
          console.log('begin transaction')
          tx.begin( function( error ){
            return next( error );
          });
        }

        // Update existing addresses with default false
        // and save the new address
      , function( next ){
          console.log('Update and save')
          if ( this.is_default ){
            tx.addresses.update( addressLookup, { is_default: false } );
          }

          console.log('inserting', this);
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
          console.log('Commit and extend')
          tx.commit( function( error ){
            if ( error ){
              logger.warn('Error committing transaction', {
                error: error
              });

              return next( error );
            }

            utils.extend( this, result );

            console.log('finishing up')
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

  , saveExisting: function( data, callback ){
      if ( typeof data === 'function' ){
        callback = data;
        data = null;
      }

      data = data || this;

      var tx = db.dirac.tx.create();

      tx.begin( function( error ){
        if ( error ){
          tx.rollback();
          return callback( error );
        }

        tx.polls.update( this.getWhereClause(), data, { returning: ['*'] }, function( error, results ){
          if ( error ) return callback( error );

          tx.commit( function( error ){
            utils.extend( this, results[0] );

            return callback( error, results );
          });
        }.bind( this ));
      }.bind( this ));
    }
  });