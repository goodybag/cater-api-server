if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define(function(require, exports, module){
  var strategies = {};

  strategies.validDatetime = function( curr ){
    var date = this.order.get('datetime');

    if ( date==null ) return true;
    if ( typeof date !== 'string' ) return curr;
    if ( !moment(date).isValid() ) return curr;

    return curr;
  };

  strategies.validDeliveryGuestCombo = function ( curr ){
    var date = this.order.get('datetime');
    var restaurant = this.order.restaurant;
    if ( restaurant.get('lead_times') == null ) return true;
    if ( _.isArray( restaurant.get('lead_times') ) && restaurant.get('lead_times').length === 0 ){
      return true;
    }

    // Get lowest lead time per guest amt
    var limit = restaurant.getLeadTime(this.order);

    // Get the current time
    var now = moment().tz(this.order.get('timezone')).format('YYYY-MM-DD HH:mm:ss');

    // Get delta between order datetime and now
    var minutes = (moment(date) - moment(now)) / 60000;

    // Get lead time
    var leadTime = limit.lead_time;

    // plenty of time? good to go
    if ( limit && minutes >= leadTime ) return true;

    // not enough leadtime bro
    if ( !limit || minutes < leadTime ){
      limit = _.find(_.sortBy(this.get('pickup_lead_times'), 'max_guests'), function(obj){
        return obj.max_guests >= order.get('guests');
      });
    }
    return curr;
  };

  strategies.validPickupGuestCombo = function( curr ){
    // TODO
    return curr;
  };

  return strategies;
});
