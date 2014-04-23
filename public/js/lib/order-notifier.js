/**
 * Order Notifier
 */

if (typeof module === 'object' && typeof define !== 'function') {
  var define = function(factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require){
  var utils = require('utils');
  var module = {
    send: function( notification, callback ){
      utils.enforceRequired( notification [ 'id', 'order_id' ] );

      utils.ajax({
        type:     'POST'
      , json:     true
      , headers:  { 'Content-Type': 'application/json' }
      , url: [
          '/api/orders'
        , notification.order_id
        , 'notifications'
        , notification.id
        ].join('/')
      , success:  function(){ callback(); }
      , error:    callback
      });
    }
  };

  return module;
});