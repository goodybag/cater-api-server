define(function(require, exports, module) {
  var utils           = require('utils');
  var PaymentSummary  = require('../models/payment-summary');

  return module.exports = utils.Collection.extend({
    model: PaymentSummary

  , url: function(){
      return [
        '/api/restaurants/'
      , this.restaurant_id
      , '/payment-summaries/'
      , this.payment_summary_id
      , '/items'
      ].join('');
    }

  , initialize: function( options ){
      this.restaurant_id      = options.restaurant_id;
      this.payment_summary_id = options.payment_summary_id;
      return this;
    }

  , create: function(){
      if ( arguments[0] === undefined ) arguments[0] = {};

      // Always set restaurant_id & payment_summary_id on new models
      arguments[0].restaurant_id      = this.restaurant_id;
      arguments[0].payment_summary_id = this.payment_summary_id;

      return utils.Collection.prototype.create.apply( this, arguments );
    }
  });
});