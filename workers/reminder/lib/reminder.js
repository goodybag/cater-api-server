/**
 * Reminder
 */

var fs        = require('fs');
var async     = require('async');
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

reminder.saveStorage = function( storage, callback ){

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
      function( next, done ){
        next('get-available');
      }

    , 'get-available':
      function( next, done ){
        Models.Reminder.find( { limit: 99999 }, function( error, results ){
          if ( error ) return done( error );

          next( 'prepare-storage', utils.pluck( results, 'attributes' ) );
        });
      }

    , 'prepare-storage':
      function( results, next, done ){
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
          if ( reminder.reminders[ result.name ] )
          if ( reminder.reminders[ result.name ].schema ){
            reminder.ensureSchema(
              reminder.reminders[ result.name ].schema
            , storage[ name ]
            );
          }
        });

        next( 'run-checks', storage );
      }
    })

  , 'run-checks':
    function( storage, next, done ){
      var checks = {};

      Object.keys( reminder.reminders ).forEach( function( name ){
        checks[ name ] = function( done ){
          return reminder.reminders[ name ].check( storage[ key ], function( error, result ){
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
    function( storage, results, next, done ){
      var works = {};

      Object.keys( results ).filter( function( key ){
        return !!results[ key ];
      }).forEach( function( key ){
        works[ key ] = function( done ){
          reminder.reminders[ key ].work( storage[ key ], function( error, stats ){
            // We do not want to stop all work on error
            // Just push and log
            if ( error ) errors.push( error );

            return done( null, stats );
          });
        }
      });

      async.series( works, function( error, results ){
        reminder.saveStorage( storage, function( error ){
          done( null, results );
        });
      });
    }
  })(function( error, results ){
    callback( errors, results );
  });
};