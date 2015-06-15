/**
 * Orders.Charge
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var utils = require('utils');
  var plans = require('restaurant-plans');

  return require('stampit')()
    .compose( require('./base') )
    .state({
      
    })
    .methods({
      getRestaurantCut: function( options ){
        options = utils.defaults( options || {}, {
          userAdjustment: true
        });

        var cut = [
          this.getSubTotal()
        , this.adjustment
        , options.userAdjustment ? this.userAdjustment  : 0
        , this.type === 'deliver' ? this.delivery_fee   : 0
        , this.type === 'deliver' ? this.tip            : 0
        , -this.getApplicationCut()
        ].reduce( utils.add, 0 );
      }

    , getApplicationCut: function(){
        var plan = plans[ this.restaurant.plan.type ];

        return [
          this.getTax()
        , plan.getApplicationCut()
        ].reduce( utils.add, 0 )
      }
    });
});
