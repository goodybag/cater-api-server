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

  , initialize: function( options ){
      this.restaurant_id = options.restaurant_id;
      return this;
    }

  , create: function(){
      if ( arguments[0] === undefined ) arguments[0] = {};

      // Always set restaurant_id on new models
      arguments[0].restaurant_id = this.restaurant_id;

      return utils.Collection.prototype.create.apply( this, arguments );
    }
  });
});