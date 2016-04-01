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
  var profiler = require('../../../../../lib/profiler')();

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
    , priority_account_price_hike_percentage: 0
    , tip: 0
    })
    // .enclose( function(){
    //   this.items = (this.items || []).map( function( item ){
    //     item = items( item );

    //     if ( this.priority_account_price_hike_percentage ){
    //       item.priority_account_price_hike_percentage = this.priority_account_price_hike_percentage;
    //     }

    //     return item;
    //   }.bind( this ));
    // })
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
        // return this.items;
        return (this.items || []).map( function( item ){
          item = items( item );

          if ( this.priority_account_price_hike_percentage ){
            item.priority_account_price_hike_percentage = this.priority_account_price_hike_percentage;
          }

          return item;
        }.bind( this ));
      }

    , getNoContractFee: function(){
        if ( this.restaurant.plan ) return 0;
        return Math.round( this.getTotalForContractFee() * this.restaurant.no_contract_fee );
      }

    , getTotalForContractFee: function() {
        return 0
        + this.getSubTotal()
        + this.getPriorityAccountCost()
        + this.adjustment_amount
        + this.user_adjustment_amount
        + this.getTax()
        + this.delivery_fee
        + this.tip
        + this.service_fee
        ;
      }

    , getTotal: function( options ){
        return 0
        + this.getSubTotal()
        + this.getPriorityAccountCost()
        + this.adjustment_amount
        + this.user_adjustment_amount
        + this.getTax()
        + this.delivery_fee
        + this.tip
        + this.getNoContractFee()
        + this.service_fee
        ;
      }

    , getSubTotal: function(){
        return 0
        + this.getItemTotal()
        + this.getAmenityTotal()
        ;
      }

    , getRestaurantTotal: function(){
        return 0
        + this.getSubTotal()
        + this.adjustment_amount
        + this.getTax()
        + this.type === 'delivery' ? this.delivery_fee : 0
        + this.type === 'delivery' ? this.tip : 0
        ;
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
        if ( this.priority_account_price_hike_percentage === 0 ){
          return 0;
        }

        var copyToAmenity = {
          guests: this.guests
        , priority_account_price_hike_percentage: this.priority_account_price_hike_percentage
        };

        return 0
        + this.getItems().reduce( function( total, item ){
            return total + (item.getPriorityAccountCost() * item.quantity);
          }, 0 )

        + this.amenities.reduce( function( total, amenity ){
            return total + amenities(
              utils.extend( {}, amenity, copyToAmenity )
            ).getPriorityAccountCost();
          }, 0 )
        ;
      }

    , getPriorityAccountSubTotal: function(){
        return 0
        + this.getSubTotal()
        + this.getPriorityAccountCost()
        ;
      }

    , getDeadline: function(){
        if ( !this.restaurant ) return null;
        if ( !this.restaurant.region ) return null;
        if ( !this.type === 'delivery' && !this.restaurant.lead_times ) return null;
        if ( !this.type !== 'delivery' && !this.restaurant.pickup_lead_times ) return null;

        var datetime = moment.tz( this.datetime, this.timezone );

        var leadTimeModifier = moment.duration( this.restaurant.region.lead_time_modifier );
        var leadTimes = this.type === 'delivery'
          ? this.restaurant.lead_times
          : this.restaurant.pickup_lead_times
              .map( function( leadTime ){
                return utils.extend(
                  {}, leadTime, {
                    lead_time:  moment.duration( leadTime.lead_time, 'minutes' )
                                      .add( leadTimeModifier )
                                      .asMinutes()
                  }
                );
              });

        var minutes = moment.duration(
          datetime - moment.tz( this.timezone )
        ).asMinutes();

        // Find the appropriate lead time based on guests
        // If guests is falsey, choose the first lead_time
        var leadTime = utils.find( leadTimes, function( time ){
          return ( this.guests || 0 ) <= time.max_guests;
        }.bind( this ))

        if ( !leadTime ) return null;

        return datetime.subtract( leadTime.lead_time, 'minutes' )
      }
    });

  Order.applyPriceHike = function( order ){
    // profiler.profile('#' + order.id);
    order.items = order.orderItems || order.items;

    var _order = Order.create( order );
    var phike = order.priority_account_price_hike_percentage || 0;

    _order.sub_total = order.sub_total = _order.getPriorityAccountSubTotal();
    _order.priority_account_price_hike_percentage = 0;

    _order = CachedOrder.create( _order );

    order.total = _order.getTotal();
    // profiler.profile('#' + order.id);
    order.sales_tax = _order.getTax();
    order.orderItems = _order.getItems();
    order.no_contract_amount = _order.getNoContractFee();

    order.orderItems.forEach( function( item ){
      Order.applyPriceHikeToItem( item, phike );
    });

    var hikeAmenity = function( amenity ){
      amenity.price += utils.nearestNickel( phike * amenity.price )
    };

    if ( Array.isArray( order.restaurant.amenities ) ){
      order.restaurant.amenities.forEach( hikeAmenity );
    }

    if ( Array.isArray( order.amenities ) ){
      order.amenities.forEach( hikeAmenity );
    }

    return order;
  };

  Order.applyPriceHikeToItem = function( item, phike ){
    phike = phike || 0;

    var cloned = items.create( item );
    cloned.priority_account_price_hike_percentage = phike;
    return utils.extend( item, cloned.toPriceHikedAttrs() );
  };

  Order.applyRestaurantTotals = function( order, options ){
    options = options || {};

    var _order = options.useCachedSubTotal ? CachedOrder.create( order ) : Order.create( order );

    if ( Array.isArray( _order.orderItems ) ){
      _order.items = _order.orderItems;
    }

    // Zero out price hike and other user-specific fields
    _order.priority_account_price_hike_percentage = 0;
    _order.user_adjustment_amount = 0;

    if ( order.type === 'courier' || order.type === 'pickup' ){
      order.delivery_fee  = _order.delivery_fee = 0;
      order.tip           = _order.tip          = 0;
    }

    // Re-calculate totals using $0 for deliveryfee/tip
    order.total         = _order.getTotal();
    order.sub_total     = _order.getSubTotal();
    order.sales_tax     = _order.getTax();
  };

  var CachedOrder = require('stampit')()
    .compose( Order )
    .state({

    })
    .methods({
      getSubTotal: function(){
        return this.sub_total;
      }
    });

  Order.Cached = CachedOrder;
  
  return Order;
});
