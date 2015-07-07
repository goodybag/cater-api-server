if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var utils   = require('utils');
  var config  = require('config');
  var rPlans  = require('restaurant-plans/index');

  return module.exports = utils.Model.extend({
    defaults: {
      gb_fee:             0
    , sub_total:          0
    , delivery_fee:       0
    , tip:                0
    , adjustment:         0
    }

  , initialize: function( attr, options ){
      this.on( 'change:order',  this.onOrderChange, this );
      this.on( 'change',        this.onChange, this );
      this.on( 'change:gb_fee', this.onFeeChange, this );

      this.onFeeChange( this, this.get('gb_fee') );
      this.onTaxChange( this, this.get('sales_tax') );

      this.plan = rPlans[ attr.plan.type ];
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
        delivery_fee:     order.get('delivery_fee')
      , sub_total:        order.get('sub_total')
      , adjustment:       order.get('adjustment_amount') || 0
      , tip:              order.get('tip')
      , gb_fee:           0
      , sales_tax:        order.get('sales_tax') === 0 ? 0 : this.get('sales_tax')
      , order:            order
      , plan:             this.attributes.plan
      };

      if ( order.get('type') === 'courier' ){
        data.tip          = 0;
        data.delivery_fee = 0;
      }

      if ( this.plan ){
        if ( this.get('plan').type === 'tiered' ){
          data.gb_fee = this.plan.getTier( this.get('plan'), order.get('total') ).fee;
        } else if ( this.get('plan').type === 'flat' ){
          data.gb_fee = this.get('plan').data.fee;
        }
      }

      data.net_payout = this.getNetPayout( data );

      this.set( data );

      return this;
    }

  , getNetPayout: function( data ){
      data = data || this.attributes;
      var order = data.order;

      if ( !order ) return 0;

      order = order.attributes;

      var val = this.getPreSalesTaxTotal();
      var tax = val * data.sales_tax;

      val += tax;
      val += order.tip;

      if ( order.type === 'courier' ) {
        // analogous to getTotalForPayoutCalculations
        val -= order.tip;
        val -= order.delivery_fee;
      }

      val -= data.gb_fee * val;
      val -= tax;

      return Math.round( val );
    }

  , getTotal: function(){
      var total = this.getPreSalesTaxTotal();
      total += total * this.get('sales_tax');
      total += this.attributes.tip;
      return total;
    }

  , getPreSalesTaxTotal: function(){
      var order = this.get('order');
      if ( !order ) return 0;
      return order.get('sub_total') + (order.get('adjustment_amount') || 0) + order.get('delivery_fee');
    }

  , onOrderChange: function( psi, order ){
      var porder = this.previous('order');
      if ( order )
      if ( !porder || porder.cid !== order.cid ) {
        this.updatePropertiesBasedOnOrder( order );
        this.onFeeChange( this, this.get('gb_fee') );
        this.onTaxChange( this, this.get('sales_tax') );
      }

    }

  , onFeeChange: function( pse, factor ){
      this.set( 'gb_fee_amount', Math.round( this.getTotal() * factor ) );
    }

  , onTaxChange: function( pse, factor ){
      var val = this.getPreSalesTaxTotal();
      val = Math.round( val * factor );
      this.set( 'sales_tax_amount', val );
    }

  , onChange: function(){
      this.set( 'order_total',  Math.round( this.getTotal() ) );
      this.set( 'net_payout',   this.getNetPayout() );
    }
  });
});
