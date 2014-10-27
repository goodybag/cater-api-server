define(function(require, exports, module) {
  var utils               = require('utils');
  var PaymentSummaryItem  = require('../models/payment-summary-item');

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
      return this;
    }

  , _prepareModel: function( attrs, options ){
      if ( attrs instanceof utils.Model ) return attrs;

      // Always set payment_summary_id/sales_tax on new models
      attrs.payment_summary_id = this.payment_summary_id;
      attrs.sales_tax = this.sales_tax;
      return utils.Collection.prototype._prepareModel.call( this, attrs, options );
    }
  });
});