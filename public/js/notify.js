(function( exports ){
  var notify = exports.notify = {};

  notify.error = function( msg ){
    if ( typeof msg === 'object' ) msg = JSON.stringify( msg );
    console.error( msg );
  };
})( window );