define(function(){
  var notify = {};

  notify.error = function( msg ){
    // segment.io requires properties to be an object
    if ( typeof msg !== 'object' ) msg = { error: msg };
    if ( window.analytics ) analytics.track('Error', msg);
    console.error( msg );
  };

  return notify;
});
