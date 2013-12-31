/**
 * Reminder
 */

var fs        = require('fs');
var async     = require('async');
var db        = require('../../../db');
var utils     = require('../../../utils');
var Models    = require('../../../models');
var config    = require('../../../config');
var reminder = module.exports = {};

reminder.reminders = {};

reminder.register = function( module ){
  if ( typeof module !== 'object' )
    throw new Error('reminder.register - first argument must be type `object`');
  if ( typeof module.name !== 'string' )
    throw new Error('reminder.register - module.name must be type `string`');
  if ( typeof module.check !== 'function' )
    throw new Error('reminder.register - module.check must be type `function`');
  if ( typeof module.work !== 'function' )
    throw new Error('reminder.register - module.work must be type `function`');

  reminder.reminders[ module.name ] = module;
};

reminder.ensureSchema = function( schema, storage ){
  Object.keys( schema ).forEach( function( key ){
    if ( !(key in storage) ) storage[ key ] = {};
    if ( typeof schema[ key ] === 'object' ){
      reminder.ensureSchema( schema[ key ], storage[ key ] )
    }
  });
};

reminder.saveStorage = function( name, storage, callback ){
  var $query = db.builder.sql({
    type: 'upsert'
  , table: 'reminders'
  , where: { name: name }
  , upsert: {
      name: name
    , data: JSON.stringify( storage )
    }
  });

  db.query( $query, callback );
};

reminder.run = function( callback ){
  callback = callback || function(){};

  var errors = [];

  utils.stage({
    'start':
    function( next, done ){
      next('get-storage');
    }

  , 'get-storage': utils.stage({
      'start':
      function( prev, next, done ){
        next( 'get-available', prev );
      }

    , 'get-available':
      function( prev, next, done ){
        Models.Reminder.find( { limit: 99999 }, function( error, results ){
          if ( error ) return done( error );

          next( 'prepare-storage', utils.pluck( results, 'attributes' ), prev );
        });
      }

    , 'prepare-storage':
      function( results, prev, next, done ){
        var storage = {};

        results.forEach( function( result ){
          storage[ result.name ] = result.data;
        });

        // Fill in blank storage spots
        Object.keys( reminder.reminders ).forEach( function( name ){
          if ( name in storage ) return;

          storage[ name ] = {};
        });

        // Ensure each storage object matches schema
        Object.keys( storage ).forEach( function( name ){
          if ( reminder.reminders[ name ] )
          if ( reminder.reminders[ name ].schema ){
            reminder.ensureSchema(
              reminder.reminders[ name ].schema
            , storage[ name ]
            );
          }
        });

        prev( 'run-checks', storage );
      }
    })

  , 'run-checks':
    function( storage, next, done ){
      var checks = {};

      Object.keys( reminder.reminders ).forEach( function( name ){
        checks[ name ] = function( done ){
          return reminder.reminders[ name ].check( storage[ name ], function( error, result ){
            // We do not want to stop all checks on error
            // Just push and log
            if ( error ){
              errors.push( error );
              return done( null, false );
            }

            return done( null, result );
          });
        };
      });

      async.series( checks, function( error, results ){
        return next( 'run-works', storage, results );
      });
    }

  , 'run-works':
    function( storage, results, next, complete ){
      var works = {};

      Object.keys( results ).filter( function( key ){
        return !!results[ key ];
      }).forEach( function( key ){
        works[ key ] = function( done ){
          reminder.reminders[ key ].work( storage[ key ], function( error, stats ){
            // We do not want to stop all work on error
            // Just push and log
            if ( error ) errors.push( error );

            // Save storage
            reminder.saveStorage( key, storage[ key ], function( error ){
              if ( error ) return complete( error );
              done( null, stats );
            });
          });
        }
      });

      async.series( works, complete );
    }
  })(function( error, results ){
    if ( error ) errors.push( error );
    callback( errors, results );
  });
};