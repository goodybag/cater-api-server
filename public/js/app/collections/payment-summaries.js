define(function(require, exports, module) {
  var utils           = require('utils');
  var PaymentSummary  = require('../models/payment-summary');

  return module.exports = utils.Collection.extend({
    model: PaymentSummary

  , url: function(){
      return [
        '/api/restaurants/'
      , this.restaurant_id
      , '/payment-summaries'
      ].join('');
    }

  , initialize: function( models, options ){
      this.restaurant_id  = options.restaurant_id;
      this.sales_tax      = options.sales_tax;
      return this;
    }

  , _prepareModel: function( attrs, options ){
      if ( attrs instanceof utils.Model ) return attrs;

      attrs = attrs || {};
      options = options || {};

      // Always set payment_summary_id/sales_tax on new models
      attrs.restaurant_id = this.restaurant_id;
      options.sales_tax = this.sales_tax;

      return utils.Collection.prototype._prepareModel.call( this, attrs, options );
    }
  });
});