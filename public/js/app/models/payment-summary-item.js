define(function(require, exports, module) {
  var utils = require('utils');

  return module.exports = utils.Model.extend({
    defaults: {
      gb_fee:       0
    , sales_tax:    0
    , order_total:  0
    }

  , initialize: function( attr, options ){
      this.on( 'change:order', this.onOrderChange, this );
    }

  , toJSON: function( options ){
      var obj = utils.Model.prototype.toJSON.call( this, options );

      if ( obj.order ){
        obj.order_id = obj.order.id;
        delete obj.order;
      }

      obj.net_payout = this.get('order_total') - this.get('gb_fee') - this.get('sales_tax');

      return obj;
    }

  , updatePropertiesBasedOnOrder: function( order ){
      order = order || this.order;

      var data = {
        delivery_fee: order.get('delivery_fee')
      , order_total:  order.getTotal()
      , sales_tax:    parseInt( config.salesTax * total )
      };
console.log("settings", data);
      this.set( data );

      return this;
    }

  , onOrderChange: function( order ){
      this.updatePropertiesBasedOnOrder( order );
    }
  });
});