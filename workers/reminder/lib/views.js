// var fs    = require('fs');
// var path  = require('path');
// var hbs   = require('hbs');
// var app   = require('express')();

// app.configure( function(){
//   app.set( 'view engine', 'hbs' );
//   app.set( 'views', path.resolve( __dirname, '../../../views' ) );
//   app.set( 'config', require('../../../config') );
// });

// require('../../../helpers').register( hbs );
// require('../../../lib/partials').register( hbs );

// var initialDir = path.resolve( __dirname, '../../../views' );
// var dirs = [ initialDir ];
// var dir;

// while ( dir = dirs.pop() ){
//   fs.readdirSync( dir ).filter( function( file ){
//     if ( fs.statSync( path.join( dir, file ) ).isDirectory() ){
//       dirs.push( path.join( dir, file ) );
//       return false;
//     }

//     return file.slice(-4) === '.hbs' && fs.statSync( path.join( dir, file ) ).isFile();
//   }).map( function( file ){
//     return {
//       name:     file.replace( '.hbs', '' ).replace( /\-/g, '_' )
//     , contents: fs.readFileSync( path.join( dir, file ) ).toString()
//     }
//   }).forEach( function( file ){
//     if ( file.name === 'order_reminder' ) console.log( file.contents );
//     module.exports[ file.name ] = hbs.compile( file.contents );
//   });
// }

/**
 * Just proxy to app so we can access the `render` method
 */
module.exports = require('../../../app');