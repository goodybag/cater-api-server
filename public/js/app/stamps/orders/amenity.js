/**
 * Orders.Amenity
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var utils = require('utils');

  return require('stampit')()
    .state({
      guests:       0
    , price:        0
    , scale:        'flat'
    , enabled:      false
    , priority_account_price_hike_percentage: 0
    })
    .enclose( function(){

    })
    .methods({
      getTotal: function(){
        if (this.scale === 'flat') return this.price;
        else if (this.scale === 'multiply') return this.price * this.guests;
        throw new Error('Invalid amenity scale type');
      }

    , getPriorityAccountCost: function(){
        return utils.nearestNickel(
          this.getTotal() * this.priority_account_price_hike_percentage
        );
      }
    });
});
