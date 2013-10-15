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

    console.log(result);

    process.nextTick( function(){
      callback( result.error, result.data );
    });
  });

  // var phantomjs = proc.spawn( config.phantomjs.process, args );

  // phantomjs.stderr.on( 'data', callback );

  // phantomjs.stdout.on( 'data', function( data ){
  //   console.log("data!!!", data)
  //   var result = JSON.parse( data );

  //   callback( result.error, result.data );
  // });

  // phantomjs.on( 'close', function( code ){
  //   if ( code != 0 ) return callback( new Error('PhantomJS did not exit with status code `0`') );
  //   return calblack();
  // });
};