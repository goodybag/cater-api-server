/**
 * Orders.Item
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var utils = require('utils');

  var Item = require('stampit')()
    .state({
      quantity:     1
    , price:        0
    , options_sets: []
    , priority_account_price_hike_percentage: 0
    })
    .methods({
      getTotal: function(){
        return [
          this.getBaseCost()
        , this.getOptionsCost()
        , this.getPriorityAccountCost()
        ].reduce( utils.add, 0 ) * this.quantity;
      }

    , getTotalWithoutPriorityAccountCost: function(){
        return [
          this.getBaseCost()
        , this.getOptionsCost()
        ].reduce( utils.add, 0 ) * this.quantity;
      }

    , getBaseCost: function(){
        return this.price;
      }

    , getOptionsCost: function(){
        return this.getFlattenedActiveOptions()
          .reduce( function( t, option ){
            return t + option.price;
          }, 0 );
      }

    , getFlattenedActiveOptions: function(){
        return utils.chain( this.options_sets )
          .pluck('options')
          .flatten()
          .filter( function( option ){
            return option.state;
          })
          .value();
      }

    , getPriorityAccountBaseCost: function(){
        if ( this.priority_account_price_hike_percentage === 0 ){
          return 0;
        }

        return utils.nearestNickel(
          this.getBaseCost() * this.priority_account_price_hike_percentage
        );
      }

    , getPriorityAccountOptionsCost: function(){
        if ( this.priority_account_price_hike_percentage === 0 ){
          return 0;
        }

        var hike = this.priority_account_price_hike_percentage;

        return this.getFlattenedActiveOptions().reduce( function( total, option ){
          return total + utils.nearestNickel(
            option.price * hike
          );
        }, 0 );
      }

    , getPriorityAccountCost: function(){
        if ( this.priority_account_price_hike_percentage === 0 ){
          return 0;
        }

        return [
          this.getPriorityAccountBaseCost()
        , this.getPriorityAccountOptionsCost()
        ].reduce( utils.add, 0 );
      }

    , getPriorityAccountTotal: function(){
        return this.getPriorityAccountCost() * this.quantity;
      }

      /**
       * Create a cloned POJO of the item with price hike
       * factored into properties
       */
    , toPriceHikedAttrs: function(){
        var hike = this.priority_account_price_hike_percentage;

        var item = {
          price:        this.price + this.getPriorityAccountBaseCost()
        , quantity:     this.quantity
        , options_sets: (this.options_sets || []).map( function( group ){
                          return utils.extend( {}, group, {
                            options:  group.options.map( function( option ){
                                        return utils.extend( {}, option, {
                                          price: option.price + utils.nearestNickel(
                                            option.price * hike
                                          )
                                        });
                                      })
                          });
                        })
        };

        // Without priority cost because priority costs have
        // already been added into `item`
        item.sub_total = Item( item ).getTotalWithoutPriorityAccountCost()

        return item;
      }
    });

  return Item;
});