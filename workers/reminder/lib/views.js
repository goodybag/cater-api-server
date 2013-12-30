var fs    = require('fs');
var path  = require('path');
var utils = require('../../../utils');

var initialDir = path.resolve( __dirname, '../../../views' );
var dirs = [ initialDir ];
var dir;

while ( dir = dirs.pop() ){
  fs.readdirSync( dir ).filter( function( file ){
    if ( fs.statSync( path.join( dir, file ) ).isDirectory() ){
      dirs.push( path.join( dir, file ) );
      return false;
    }

    return file.slice(-4) === '.hbs' && fs.statSync( path.join( dir, file ) ).isFile();
  }).map( function( file ){
    return {
      name:     file.replace( '.hbs', '' ).replace( /\-/g, '_' )
    , contents: fs.readFileSync( path.join( dir, file ) ).toString()
    }
  }).forEach( function( file ){
    module.exports[ file.name ] = utils.template( file.contents );
  });
}