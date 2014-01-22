define(function(require, exports, module) {
  var utils = require('utils');

  return module.exports = utils.Model.extend({
    initialize: function( attr, options ){
      this.on( 'change:order', function( order ){
        console.log("OrderID Changed to:", order)
      });
    }

  , toJSON: function(){
      var obj = utils.Model.prototype.toJSON.call( this );

      if ( obj.order ){
        obj.order_id = obj.order.id;
        delete obj.order;
      }

      return obj;
    }
  });
});