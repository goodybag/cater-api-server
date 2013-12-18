/**
 * Reminder
 */

var fs        = require('fs');
var async     = require('async');
var _         = require('lodash');
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

reminder.run = function( callback ){
  callback = callback || function(){};

  var toRun = {}, checks = {}, errors = [];

  Object.keys( reminder.reminders ).forEach( function( name ){
    checks[ name ] = function( done ){
      return reminder.reminders[ name ].check( function( error, result ){
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
    Object.keys( results ).filter( function( key ){
      return !!results[ key ];
    }).forEach( function( key ){
      toRun[ key ] = function( done ){
        reminder.reminders[ key ].work( function( error, stats ){
          // We do not want to stop all work on error
          // Just push and log
          if ( error ) errors.push( error );

          return done( null, stats );
        });
      }
    });

    async.series( toRun, function( error, results ){
      callback( errors, results );
    });
  });
};