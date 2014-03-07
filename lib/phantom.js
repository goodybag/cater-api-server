var path    = require('path')
var proc    = require('child_process');
var config  = require('../config');
var utils   = require('../utils');

module.exports.run = function( args ){
  if ( !Array.isArray( args ) ) args = Array.prototype.slice.call( arguments );
  var callback = utils.noop;

  if ( typeof args[ args.length - 1 ] === 'function' ){
    callback = args.pop();
  }

  args.unshift( config.phantomjs.process );

  var phantomjs = proc.exec( args.join(' '), function( error, stdout, stderr ){
    if ( error && !stdout ) return callback( error );

    var result = JSON.parse( stdout );

    if ( error && !('error' in result) ) return callback( error );

    process.nextTick( function(){
      callback( result.error, result.data );
    });
  });
};