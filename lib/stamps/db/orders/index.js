var fs = require('fs');
var path = require('path');
var stamps = [];
var stampit = require('stampit');

fs.readdirSync( __dirname ).filter( function( f ){
  return fs.statSync( path.join( __dirname, f ) ).isFile();
}).filter( function( f ){
  return f.slice(-3) === '.js' && f !== 'index.js';
}).forEach( function( f ){
  stamps.push(require( path.join( __dirname, f ) ) );
});

module.exports = stampit();
module.exports = module.exports.compose.apply(
  module.exports
, stamps
);
