var assert = require('assert');
var Restaurant = require('../../public/js/app/models/restaurant');
var Order = require('../../public/js/app/models/order');
var moment = require('moment-timezone');
var utils = require('utils');

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
      it('should return false if not enough lead time for pickup', function() {
        // Contrived regression test:
        // Suppose 24 hrs pickup lead times for a datetime 2 days ago.

        // Delivery Hours
        var delivery_times = utils.object(utils.range(7), utils.map(utils.range(7), function() { return []; }) );
        order.restaurant.set('delivery_times', delivery_times);

        // Hours of operation
        var hours_of_operation = utils.object(utils.range(7), utils.map(utils.range(7), function() { return ['00:00:00', '24:00:00']; }) );
        order.restaurant.set('hours_of_operation', hours_of_operation);

        // Pickup lead times
        var now = moment().tz(order.get('timezone')).subtract(2, 'days').format('YYYY-MM-DD HH:mm:ss');
        order.set('datetime', now);
        restaurant.set('pickup_lead_times', [ { cancel_time: 24, lead_time: 1440, max_guests: 100 } ]);

        assert(!restaurant.isValidGuestDateCombination(order));
      });

      it('should return true if pickup and delivery lead times are null', function() {
        var delivery_times = utils.object(utils.range(7), utils.map(utils.range(7), function() { return []; }) );
        var hours_of_operation = utils.object(utils.range(7), utils.map(utils.range(7), function() { return ['00:00:00', '24:00:00']; }) );
        var now = moment().tz(order.get('timezone')).format('YYYY-MM-DD HH:mm:ss');

        order.restaurant.set('lead_times', null);
        order.restaurant.set('pickup_lead_times', null);
        order.restaurant.set('delivery_times', delivery_times);
        order.restaurant.set('hours_of_operation', hours_of_operation);

        order.set('datetime', now);

        assert(restaurant.isValidGuestDateCombination(order));
      });

      it('should return true if pickup and delivery lead times are empty', function() {
        var delivery_times = utils.object(utils.range(7), utils.map(utils.range(7), function() { return []; }) );
        var hours_of_operation = utils.object(utils.range(7), utils.map(utils.range(7), function() { return ['00:00:00', '24:00:00']; }) );
        var now = moment().tz(order.get('timezone')).format('YYYY-MM-DD HH:mm:ss');

        order.restaurant.set('delivery_times', delivery_times);
        order.restaurant.set('hours_of_operation', hours_of_operation);

        order.set('datetime', now);

        assert(restaurant.isValidGuestDateCombination(order));
      });
    });
  });
});
