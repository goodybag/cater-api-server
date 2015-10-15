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
  var amenities = require('./amenity');
  var moment = require('moment-timezone');

  var Order = require('stampit')()
    .state({
      items: []
    , amenities: []
    , adjustment_amount: 0
    , user_adjustment_amount: 0
    , guests: 0
    , delivery_fee: 0
    , payment_method_id: null
    , service_fee: 0
    })
    .methods({
      getTax: function(){
        if ( this.user && this.user.is_tax_exempt ){
          return 0;
        }

        var amount = [
          this.getSubTotal()
        , this.getPriorityAccountCost()
        , this.adjustment_amount
        , this.user_adjustment_amount
        , this.delivery_fee
        , this.service_fee
        ].reduce( utils.add, 0 );

        return Math.round( amount * this.restaurant.region.sales_tax );
      }

    , getAmenityTotal: function() {
        return this.amenities.reduce( function( total, amenity ){
          amenity.guests = this.guests; // mixin guests to amenity
          return total + amenities( amenity ).getTotal();
        }.bind(this), 0 );
      }

    , getItemTotal: function(){
        return this.getItems().reduce( function( total, item ){
          return total + item.getTotalWithoutPriorityAccountCost();
        }, 0 );
      }

    , getItems: function(){
        var user = this.user;

        return this.items.map( function( item ){
          item = items( item );

          if ( user && user.priority_account_price_hike_percentage ){
            item.priority_account_price_hike_percentage = user.priority_account_price_hike_percentage;
          }

          return item;
        });
      }

    , getNoContractFee: function(){
        if ( this.restaurant.plan ) return 0;
        return Math.round( this.getTotalForContractFee() * this.restaurant.no_contract_fee );
      }

    , getTotalForContractFee: function() {
        return [
          this.getSubTotal()
        , this.adjustment_amount
        , this.user_adjustment_amount
        , this.getTax()
        , this.delivery_fee
        , this.tip
        , this.service_fee
        ].reduce( utils.add, 0 );
      }

    , getTotal: function( options ){
        return [
          this.getSubTotal()
        , this.getPriorityAccountCost()
        , this.adjustment_amount
        , this.user_adjustment_amount
        , this.getTax()
        , this.delivery_fee
        , this.tip
        , this.getNoContractFee()
        , this.service_fee
        ].reduce( utils.add, 0 );
      }

    , getSubTotal: function(){
        return [
          this.getItemTotal()
        , this.getAmenityTotal()
        ].reduce( utils.add, 0 );
      }

    , getRestaurantTotal: function(){
        return [
          this.getSubTotal()
        , this.adjustment_amount
        , this.getTax()
        , this.delivery_fee
        , this.tip
        ].reduce( utils.add, 0 );
      }

    , getPickupDateTime: function(){
        if ( !this.region ){
          throw new Error('Cannot calculate pickup datetime without `region`');
        }

        if ( !this.datetime ){
          throw new Error('Cannot calculate pickup datetime without `datetime`');
        }

        return moment
          .tz( this.datetime, this.timezone )
          .subtract( moment.duration( this.region.lead_time_modifier ) );
      }

    , getPriorityAccountCost: function(){
        return this.getItems().reduce( function( total, item ){
          return total + item.getPriorityAccountTotal();
        }, 0 );
      }

    , getPriorityAccountSubTotal: function(){
        return [
          this.getSubTotal()
        , this.getPriorityAccountCost()
        ].reduce( utils.add, 0 );
      }
    });

  Order.applyPriceHike = function( order ){
    order.items = order.orderItems || order.items;

    var _order = Order.create( order );

    order.total = _order.getTotal();
    order.sub_total = _order.getPriorityAccountSubTotal();
    order.sales_tax = _order.getTax();
    order.orderItems = _order.getItems();
console.log('total', _order.getTotal());
    order.orderItems.forEach( function( item ){
      item.sub_total = item.getTotal();
    });

    return order;
  };
  
  return Order;
});
