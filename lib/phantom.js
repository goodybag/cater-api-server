var path    = require('path')
var proc    = require('child_process');
var config  = require('../config');
var utils   = require('../utils');

module.exports.run = function(){
  var args = Array.prototype.slice.call( arguments );
  var callback = utils.noop;

  if ( typeof args[ args.length - 1 ] === 'function' ){
    callback = args.pop();
  }

  args.unshift( config.phantomjs.process );

  var phantomjs = proc.exec( args.join(' '), function( error, stdout, stderr ){
    if ( error ) return callback( error );

    var result = JSON.parse( stdout );

    process.nextTick( function(){
      callback( result.error, result.data );
    });
  });
};