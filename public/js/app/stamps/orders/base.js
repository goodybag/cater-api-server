/**
 * Orders.Base
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var utils = require('utils');
  var items = require('./item');

  return require('stampit')()
    .state({
      items: []
    , adjustment: 0
    , userAdjustment: 0
    })
    .methods({
      getTax: function(){
        var amount = this.getSubTotal() + this.adjustment + this.userAdjustment;
        return Math.ceil( amount * this.region.sales_tax );
      }

    , getSubTotal: function(){
        return this.items.reduce( function( total, item ){
          return total + items( item ).getTotal();
        }, 0 );
      }

    , getTotal: function( options ){
        options = utils.defaults( options || {}, {
          restaurant: false
        });

        return [
          this.getSubTotal()
        , this.adjustment
        , options.restaurant ? 0 : this.userAdjustment
        , this.getTax()
        , this.delivery_fee
        , this.tip
        ].reduce( utils.add, 0 )
      }

    , getRestaurantTotal: function(){
        return [
          this.getSubTotal()
        , this.adjustment
        , this.getTax()
        , this.delivery_fee
        , this.tip
        ].reduce( utils.add, 0 )
      }
    });
});