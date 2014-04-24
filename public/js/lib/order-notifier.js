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
    send: function( note_id, order_id, callback ){
      utils.ajax({
        type:     'POST'
      , json:     true
      , headers:  { 'Content-Type': 'application/json' }
      , url: [
          '/api/orders'
        , order_id
        , 'notifications'
        , note_id
        ].join('/')
      , success:  function(){ callback(); }
      , error:    callback
      });
    }
  };

  return module;
});