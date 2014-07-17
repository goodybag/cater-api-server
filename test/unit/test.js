process.env['GB_ENV'] = 'test';

var fs    = require('fs');
var path  = require('path');

fs.readdirSync( __dirname ).filter( function( f ){
  return f.slice(-3) === '.js' && f !== 'test.js';
}).sort().forEach( function( f ){
  require( path.join( __dirname, f ) );
});