define(function(require, exports, module) {
  var utils   = require('utils');
  var config  = require('config');

  return module.exports = utils.Model.extend({
    defaults: {
      gb_fee:       0
    , sales_tax:    0
    , order_total:  0
    }

  , initialize: function( attr, options ){
      this.on( 'change:order', this.onOrderChange, this );
      this.on( 'change:gb_fee_percent', this.onFeeChange, this );
      this.on( 'change', this.onChange, this );
    }

  , toJSON: function( options ){
      var obj = utils.Model.prototype.toJSON.call( this, options );

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
      , gb_fee_percent:   0
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

  , onFeeChange: function( psi, percent ){
      this.set( 'gb_fee', this.get('order_total') * ( percent / 100 ) );
    }

  , onChange: function(){
      this.set( 'net_payout', this.getNetPayout() );
    }
  });
});