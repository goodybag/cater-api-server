var assert = require('assert');
var Restaurant = require('../../public/js/app/models/restaurant');
var Order = require('../../public/js/app/models/order');

describe.only('Restaurant Model', function() {
  it('should get remaining lead time', function() {
    var restaurant = new Restaurant({
      delivery_zips: []
    , delivery_service_zips: []
    });

    var order = new Order({
      type: 'delivery'
    , lead_times: null
    , pickup_lead_times: []
    , restaurant: restaurant
    });
    // var lt = restaurant.getLeadTime(order);
    // assert(lt.lead_time === 0);

    order.set('type', 'courier');
    lt = restaurant.getLeadTime(order);
    assert(false);
  });
});
