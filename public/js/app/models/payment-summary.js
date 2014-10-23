define(function(require, exports, module) {
  var utils = require('utils');
  var PaymentSummaryItems = require('app/collections/payment-summary-items');

  return module.exports = utils.Model.extend({
    initialize: function( attr, options ){
      if ( attr.items ){
        this.items = new PaymentSummaryItems( attr.items );
        delete attr.items;
      }
    }

  , toJSON: function(){
      var json = utils.Model.prototype.toJSON.call( this );

      if ( this.items ){
        json.items = this.items.toJSON();
      }

      return json;
    }
  });
});