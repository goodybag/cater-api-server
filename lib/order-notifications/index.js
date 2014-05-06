var fs    = require('fs');
var path  = require('path');

// Require all order notification definitions
fs.readdirSync( __dirname ).filter( function( f ){
  return fs.statSync( path.join( __dirname, f ) ).isFile();
}).filter( function( f ){
  return f.slice(-3) === '.js';
}).forEach( function( f ){
  require( path.join( __dirname, f ) );
});