if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module) {
  var utils               = require('utils');
  var PaymentSummaryItem  = require('../models/payment-summary-item');
  var Order               = require('../models/order');

  return module.exports = utils.Collection.extend({
    model: PaymentSummaryItem

  , url: function(){
      return [
        '/api/restaurants/'
      , this.restaurant_id
      , '/payment-summaries/'
      , this.payment_summary_id
      , '/items'
      ].join('');
    }

  , initialize: function( models, options ){
      this.restaurant_id      = options.restaurant_id;
      this.payment_summary_id = options.payment_summary_id;
      this.sales_tax          = options.sales_tax;
      this.plan               = options.plan;
      return this;
    }

  , _prepareModel: function( attrs, options ){
      if ( attrs instanceof utils.Model ) return attrs;

      attrs = attrs || {};
      options = options || {};

      // Always set payment_summary_id/sales_tax on new models
      attrs.payment_summary_id = this.payment_summary_id;
      attrs.sales_tax = this.sales_tax;
      attrs.plan = this.plan;

      var order;

      if ( attrs.order ){
        if ( !(attrs.order instanceof Order) ){
          attrs.order = new Order( attrs.order, { lockOrderType: true } );
        }

        order = attrs.order;
        delete attrs.order;
      }

      var model = utils.Collection.prototype._prepareModel.call( this, attrs, options );

      if ( order ){
        model.set( 'order', order );
      }

      return model
    }
  });
});