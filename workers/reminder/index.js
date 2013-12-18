/**
 * Reminder
 */

var fs        = require('fs');
var path      = require('path');
var config    = require('../../config');
var reminder  = require('./lib/reminder');

var dir = __dirname + '/reminders';

var logError = function( error ){
  console.log( error );
};

var logStat = function( group, result ){
  console.log( group );
  console.log("###############################");
  for ( var key in result ){
    console.log("  *", result[ key ].text, ":", result[ key ].value );
  }
  console.log("\n\n");
};

var logResults = function( errors, results ){
  errors.forEach( logError );

  for ( var key in results ){
    logStat( key, results[ key ] );
  }
};

fs.readdirSync( dir ).filter( function( file ){
  return fs.statSync( path.join( dir, file ) ).isFile();
}).map( function( file ){
  return require( path.join( dir, file ) );
}).forEach( reminder.register );

reminder.run( function( errors, results ){
  logResults( errors, results );
  process.exit(0);
});