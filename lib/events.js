var venter  = require('./venter');
var receipt = require('./receipt');
var utils   = require('../utils');

var events = {
  'order:change':
  function( orderId ){
    receipt.build( orderId );
  }
};

var registerEvent = function( obj, key ){
  venter.on( key, function(){
    var args = arguments;
    process.nextTick( function(){
      obj[ key ].apply( venter, args );
    });
  });
};

Object.keys( events ).forEach( utils.partial( registerEvent, events ) );