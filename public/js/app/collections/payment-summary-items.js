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
      return this;
    }

  , create: function(){
      if ( arguments[0] === undefined ) arguments[0] = {};

      // Always set payment_summary_id on new models
      arguments[0].payment_summary_id = this.payment_summary_id;

      return utils.Collection.prototype.create.apply( this, arguments );
    }

  , createModel: function(){
      var args = Array.prototype.slice.call( arguments );

      if ( args[0] === undefined ) args[0] = {};
      // Always set payment_summary_id on new models
      args[0].payment_summary_id = this.payment_summary_id;

      return utils.Collection.prototype.createModel.apply( this, args );
    }
  });
});