define(function(){
  var notify = {};

  notify.error = function( msg ){
    // segment.io requires properties to be an object
    if ( typeof msg !== 'object' ) msg = { error: msg };
    analytics.track('Error', msg);
    console.error( msg );
  };

  return notify;
});
