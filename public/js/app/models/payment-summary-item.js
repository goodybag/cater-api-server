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
    , sales_tax:          config.taxRate
    , sub_total:          0
    , delivery_fee:       0
    , tip:                0
    }

  , initialize: function( attr, options ){
      this.on( 'change:order',  this.onOrderChange, this );
      this.on( 'change',        this.onChange, this );
      this.on( 'change:gb_fee', this.onFeeChange, this );

      this.onFeeChange( this, this.get('gb_fee') );
      this.onTaxChange( this, this.get('sales_tax') );
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
      , sub_total:        order.get('sub_total')
      , tip:              order.get('tip')
      , sales_tax:        order.restaurant.get('sales_tax')
      };

      data.net_payout = this.getNetPayout( data );

      this.set( data );

      return this;
    }

  , getNetPayout: function( data ){
      data = data || this.attributes;

      var val = data.sub_total + data.delivery_fee
      var tax = Math.round( val * data.sales_tax );
      val += data.tip;

      val -= Math.round( (val + tax) * data.gb_fee );

      return val;
    }

  , getTotal: function(){
      var total = this.attributes.sub_total + this.attributes.delivery_fee;
      total += Math.round( total * this.attributes.sales_tax );
      total += this.attributes.tip;
      return total;
    }

  , onOrderChange: function( psi, order ){
      var porder = this.previous('order');
      if ( order )
      if ( !porder || porder.cid !== order.cid ) {
        this.updatePropertiesBasedOnOrder( order );
      }
    }

  , onFeeChange: function( pse, factor ){
      this.set( 'gb_fee_amount', Math.round( this.getTotal() * factor ) );
    }

  , onTaxChange: function( pse, factor ){
      var val = this.attributes.sub_total + this.attributes.delivery_fee
      val = Math.round( val * this.attributes.sales_tax );

      this.set( 'sales_tax_amount', val );
    }

  , onChange: function(){
      this.set( 'order_total',  this.getTotal() );
      this.set( 'net_payout',   this.getNetPayout() );
    }
  });
});