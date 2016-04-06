var assert = require('assert');
var Restaurant = require('../../public/js/app/models/restaurant');
var Order = require('../../public/js/app/models/order');
var moment = require('moment-timezone');
var utils = require('../../utils');

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

    describe('isValidGuestDateCombination(order)', function() {
      var delivery_times, hours_of_operation, now;

      beforeEach(function(){
        delivery_times = utils.object(utils.range(7), utils.map(utils.range(7), function() { return []; }) );
        hours_of_operation = utils.object(utils.range(7), utils.map(utils.range(7), function() { return ['00:00:00', '24:00:00']; }) );
        now = moment().tz(order.get('timezone')).subtract(2, 'days').format('YYYY-MM-DD HH:mm:ss');

        order.restaurant.set('delivery_times', delivery_times);
        order.restaurant.set('hours_of_operation', hours_of_operation);

        order.set('datetime', now);
      });

      it('should return false when there\'s not enough lead time for pickup', function() {
        // Contrived regression test:
        // Suppose 24 hrs pickup lead times for a datetime 2 days ago.
        order.restaurant.set('pickup_lead_times', [ { cancel_time: 24, lead_time: 1440, max_guests: 100 } ]);
        assert(!restaurant.isValidGuestDateCombination(order));
      });

      it('should return true if pickup and delivery lead times are null', function() {
        order.restaurant.set('lead_times', null);
        order.restaurant.set('pickup_lead_times', null);
        assert(order.restaurant.isValidGuestDateCombination(order));
      });

      it('should return true if pickup and delivery lead times are empty', function() {
        order.restaurant.set('lead_times', []);
        order.restaurant.set('pickup_lead_times', []);
        assert(order.restaurant.isValidGuestDateCombination(order));
      });

      it('should return false if does not support courier', function() {
        order.restaurant.set('supported_order_types', [ 'delivery' ]);
        assert(!order.restaurant.isValidGuestDateCombination(order));
      });

      it('should return true if it does support courier', function() {
        order.restaurant.set('supported_order_types', [ 'delivery', 'courier' ]);
        assert(!order.restaurant.isValidGuestDateCombination(order));
      });
    });
  });

  describe('#getDaysClosed', function(){
    var restaurant;
    beforeEach(function resetRestaurant() {
      restaurant = new Restaurant({
        delivery_times: {
          0: [],
          1: [],
          2: [],
          3: [],
          4: [],
          5: [],
          6: []
        },
        hours_of_operation: {
          0: [],
          1: [],
          2: [],
          3: [],
          4: [],
          5: [],
          6: []
        }
      });
    });
    it('should return all days of the week', function() {
      // Basically this is a restaurant that is never open
      // so it should be disabled every day.
      restaurant.set({
        delivery_times: {
          0: [],
          1: [],
          2: [],
          3: [],
          4: [],
          5: [],
          6: []
        },
        hours_of_operation: {
          0: [],
          1: [],
          2: [],
          3: [],
          4: [],
          5: [],
          6: []
        }
      });
      var daysClosed = restaurant.getDaysClosed();
      assert(Array.isArray(daysClosed));
      assert.deepEqual(daysClosed, utils.range(1, 8));
    });

    it('should return some days because of delivery times', function() {
      // For mocking a restaurant with delivery times, the actual
      // representation of each time slot is irrelevant.
      // We just need each day to have some length.
      restaurant.set({
        delivery_times: {
          0: [],
          1: [true],
          2: [],
          3: [],
          4: [true],
          5: [],
          6: []
        },
        hours_of_operation: {
          0: [],
          1: [],
          2: [],
          3: [],
          4: [],
          5: [],
          6: []
        }
      });
      var daysClosed = restaurant.getDaysClosed();
      assert(Array.isArray(daysClosed));
      assert.deepEqual(daysClosed, [1,3,4,6,7]);
    });

    it('should return some days because of hours of operation', function() {
      restaurant.set({
        delivery_times: {
          0: [],
          1: [],
          2: [],
          3: [],
          4: [],
          5: [],
          6: []
        },
        hours_of_operation: {
          0: [true],
          1: [],
          2: [],
          3: [true],
          4: [true],
          5: [],
          6: []
        }
      });
      var daysClosed = restaurant.getDaysClosed();
      assert(Array.isArray(daysClosed));
      assert.deepEqual(daysClosed, [2,3,6,7]);
    });


    it('should return some days because of delivery times and hours of operation', function() {
      restaurant.set({
        delivery_times: {
          0: [true],
          1: [],
          2: [],
          3: [],
          4: [],
          5: [],
          6: [true]
        },
        hours_of_operation: {
          0: [true],
          1: [],
          2: [],
          3: [true],
          4: [true],
          5: [],
          6: []
        }
      });
      var daysClosed = restaurant.getDaysClosed();
      assert(Array.isArray(daysClosed));
      assert.deepEqual(daysClosed, [2,3,6]);
    });
  });
});
