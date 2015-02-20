var assert = require('assert');
var Restaurant = require('../../public/js/app/models/restaurant');
var Order = require('../../public/js/app/models/order');

var lead_times = [
  { max_guests: 10, lead_time: 90 }
, { max_guests: 20, lead_time: 120 }
, { max_guests: 50, lead_time: 240 }
];

describe('', function() {
  it.only('should get lead time for delivery order', function() {
    var order = new Order({ delivery_service: 'lol' });
    var restaurant = new Restaurant({ lead_times: lead_times });
    order.set('restaurant', restaurant);
    console.log(restaurant.getLeadTime(order));
    assert(false);
  });

  it('should get lead time for pickup/courier order', function() {
    assert(false);
  });

  it('should default lead time to delivery leadtimes', function() {
    assert(false);
  });
});
