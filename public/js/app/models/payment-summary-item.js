if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

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
      // this.on( 'change:gb_fee', this.onFeeChange, this );
      this.on( 'change:gb_fee_percent', this.onFeePercentChange, this );
      this.on( 'change', this.onChange, this );

      this.onFeeChange( this, this.get('fee') );
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
      , order_total:      order.getTotal()
      , sales_tax:        order.getSalesTaxContribution()
      , tip:              order.get('tip')
      , gb_fee:           order.get('gb_fee') || 0
      };

      data.net_payout = this.getNetPayout( data );

      this.set( data );

      return this;
    }

  , getNetPayout: function( data ){
      data = data || this.attributes;
      return data.order_total - data.gb_fee - data.sales_tax;
    }

  , onOrderChange: function( psi, order ){
      if ( order ) this.updatePropertiesBasedOnOrder( order );
    }

  , onFeeChange: function( psi, fee ){
      this.set(
        'gb_fee_percent'
      , parseFloat(
          ((this.get('gb_fee') / this.get('order_total')) * 100).toFixed(2)
        )
      );
    }

  , onFeePercentChange: function( psi, percent ){
    console.log("setting gb_fee", this.get('order_total') * ( percent / 100 ))
      this.set( 'gb_fee', parseInt( this.get('order_total') * ( percent / 100 ) ) );
    }

  , onChange: function(){
      this.set( 'net_payout', this.getNetPayout() );
    }
  });
});