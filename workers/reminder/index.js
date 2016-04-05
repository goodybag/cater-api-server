/**
 * Reminder
 */

var fs        = require('fs');
var path      = require('path');
var config    = require('../../config');
var logger    = require('../../lib/logger').create('Worker-Reminder');
var reminder  = require('./lib/reminder');

require('../../lib/order-notifications');

var dir = __dirname + '/reminders';

var logError = function( error ){
  logger.error( error );
};

var printrow = function( character ){
  character = character || '#';
  console.log(
    Math.pow( 2, process.stdout.columns - 1 ).toString(2).replace( /./g, character )
  );
};

var logStat = function( group, result ){
  printrow('#');
  console.log( '# ' + group );
  printrow('#');

  var longest = Math.max.apply( Math, Object.keys( result ).map( function( k ){
    return result[ k ].text.length;
  }));

  for ( var key in result ){
    // Log errors by worker/reminder module
    if ( key === 'errors' && result.errors.value > 0 && result.errors.objects ){
      result.errors.objects.forEach( function( error ){
        logger.error( [ key ], error );
      });
    }

    console.log(
      "  *"
    , result[ key ].text
    , Math.pow( 2, longest - result[ key ].text.length ).toString(2).replace( /./g, ' ' )
    , ":"
    , result[ key ].value
    );
  }

  console.log("\n\n");
};

var logResults = function( errors, results ){
  console.log("\n\n")

  if ( errors && errors.length ){
    errors.forEach( logError );
  }

  for ( var key in results ){
    logStat( key, results[ key ] );
  }
};

fs.readdirSync( dir )
  .filter( function( file ){
    return fs.statSync( path.join( dir, file ) ).isFile();
  })
  .map( function( file ){
    return require( path.join( dir, file ) );
  })
  .forEach( reminder.register );

reminder.run( function( errors, results ){
  logResults( errors, results );
  process.exit(0);
});
