if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var utils   = require('utils');
  var config  = require('config');

  return module.exports = utils.Model.extend({
    defaults: {
      gb_fee:             0
    , sales_tax:          config.salesTax - 1
    , order_total:        0
    }

  , initialize: function( attr, options ){
      this.on( 'change:order', this.onOrderChange, this );
      this.on( 'change', this.onChange, this );

      this.on( 'change:gb_fee', this.onFeeChange, this );
    }

  , toJSON: function( options ){
      var obj = module.exports.__super__.toJSON.call( this, options );

      if ( obj.order ){
        obj.order_id = obj.order.id;
        delete obj.order;
      }

      obj.net_payout = this.getNetPayout();

      return obj;
    }

  , updatePropertiesBasedOnOrder: function( order ){
      order = order || this.attributes.order;

      var data = {
        delivery_fee:     order.restaurant.get('delivery_fee')
      , order_total:      order.get('sub_total')
      , tip:              order.get('tip')
      };

      data.net_payout = this.getNetPayout( data );

      this.set( data );

      return this;
    }

  , getNetPayout: function( data ){
      data = data || this.attributes;

      var val = data.order_total + data.delivery_fee
      var tax = val * data.sales_tax;
      val += data.tip;

      val -= (val + tax) * data.gb_fee;

      return Math.round( val );
    }

  , getTotal: function(){
      var total = this.attributes.order_total + this.attributes.delivery_fee;
      total += total * this.attributes.sales_tax;
      total += this.attributes.tip;
      return Math.round( total );
    }

  , onOrderChange: function( psi, order ){
      if ( order ) this.updatePropertiesBasedOnOrder( order );
    }

  , onFeeChange: function( pse, factor ){
    console.log("total is", this.getTotal())
    console.log("setting gb_fee_amount",Math.round( this.getTotal() * factor ) )
      this.set( 'gb_fee_amount', Math.round( this.getTotal() * factor ) );
    }

  , onChange: function(){
      this.set( 'net_payout', this.getNetPayout() );
    }
  });
});