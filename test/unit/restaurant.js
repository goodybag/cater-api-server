var assert = require('assert');
var Restaurant = require('../../public/js/app/models/restaurant');
var Order = require('../../public/js/app/models/order');

describe('Restaurant Model', function() {
  describe('Lead times', function() {
    var restaurant, order, lt;

    beforeEach(function() {
      restaurant = new Restaurant({
        delivery_zips: []
      , delivery_service_zips: []
      , lead_times: null
      , pickup_lead_times: []
      , region: { }
      });

      order = new Order({
        type: 'delivery'
      , restaurant: restaurant.toJSON()
      , guests: 3
      });
    });

    it('delivery no lead time', function() {
      var lt = restaurant.getLeadTime(order);
      assert(lt.lead_time === 0);
    });

    it('courier no lead time', function() {
      order.set('type', 'courier');
      var lt = restaurant.getLeadTime(order);
      assert(lt.lead_time === 0);
    });

    it('simple lead time for delivery', function() {
      restaurant.set('lead_times', [{ max_guests: 10, lead_time: 4 }] );
      order.set('type', 'delivery');
      var lt = restaurant.getLeadTime(order);
      assert(lt.lead_time === 4);
    });

    it('simple lead time for courier', function() {
      restaurant.set('pickup_lead_times', [{ max_guests: 10, lead_time: 7 }] );
      order.set('type', 'courier');
      var lt = restaurant.getLeadTime(order);
      assert(lt.lead_time === 7);
    });

    it('defer to delivery lead time if pickup lead times are unspecified', function() {
      restaurant.set('lead_times', [{ max_guests: 10, lead_time: 4 }] );
      restaurant.set('pickup_lead_times', [] );
      order.set('type', 'courier');
      var lt = restaurant.getLeadTime(order);
      assert(lt.lead_time === 4);
    });
  });
});
