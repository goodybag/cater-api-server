define(function(){
  var notify = {};

  notify.error = function( msg ){
    if ( typeof msg === 'object' ) msg = JSON.stringify( msg );
    analytics.track('notify.error', msg);
    console.error( msg );
  };

  return notify;
});