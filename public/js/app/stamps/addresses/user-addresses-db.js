var db = require('db');
var utils = require('utils');
var errors = require('errors');

module.exports = require('stampit')()
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

      var addressLookup = {
        user_id:    this.user_id
      , is_default: true
      };

      var tx = db.dirac.tx.create();

      utils.async.waterfall([
        // Check if there was an existing default
        function( address, next ){
          db.addresses.findOne( addressLookup, function( error, result ){
            if ( error ){
              return next( error );
            }

            this.is_default = this.is_default || !result;

            return next();
          }.bind( this ));
        }.bind( this )

      , tx.begin.bind( tx )

      , function( next ){
          if ( address.is_default ){
            tx.addresses.update( addressLookup, { is_default: false } );
          }

          console.log('saving', address);
          tx.addresses.insert( address, function( error, result ){
            if ( error ){
              this.logger.warn('Error inserting address', {
                error: error
              });

              return callback( error );
            }

            tx.commit( function( error ){
              if ( error ){
                this.logger.warn('Error inserting address', {
                  error: error
                });

                return res.error( errors.internal.DB_FAILURE, error );
              }

              res.json( result );
            });
          });
        }

      , function( results, next ){
          tx.polls.insert( this, { returning: ['*'] }, next );
        }.bind( this )
      , function( pollResults, next ){
          var poll = pollResults[0];

          var choices = this.choices.map( function( choice ){
            return utils.extend( { poll_id: poll.id }, utils.pick( choice, 'title', 'body' ) );
          });

          tx.poll_choices.insert( choices, { returning: ['*'] }, function( error, results ){
            return next( error, poll, results );
          });
        }.bind( this )
      , function( poll, choices, next ){
          tx.commit( function( error ){
            if ( error ){
              return next( error );
            }

            poll.choices = choices;
            utils.extend( this, poll );

            return next();
          }.bind( this ) );
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