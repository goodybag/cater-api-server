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
    send: function( note_id, order_id, options, callback ){
      if ( !note_id ){
        throw new Error('Invalid note_id');
      }

      if ( !order_id ){
        throw new Error('Invalid order_id');
      }

      if ( typeof options === 'function' ){
        callback = options;
        options = {};
      }

      options = options || {};

      utils.ajax({
        type:     'POST'
      , json:     true
      , headers:  { 'Content-Type': 'application/json' }
      , url: [
          '/api/orders'
        , order_id
        , 'notifications'
        , note_id
        ].join('/') + utils.queryParams( options )
      , success:  function(){ callback(); }
      , error:    callback
      });
    }
  };

  return module;
});