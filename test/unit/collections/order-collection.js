var assert = require('assert');
var Restaurant = require('../../../public/js/app/models/restaurant');
var Order = require('../../../public/js/app/models/order');
var User = require('../../../public/js/app/models/user');
var Orders = require('../../../public/js/app/collections/orders');
var utils = require('utils');

var sortedBy = function(list, prop) {
  var check = list.reduce(function(memo, item) {
    if ( memo.sorted ) {
      if ( memo.last === null ) {
        memo.last = utils.getProperty(item, prop);
      } else {
        memo.sorted = utils.getProperty(item, prop) >= memo.last;
        memo.last = utils.getProperty(item, prop);
      }
    }
    return memo;
  }, { last: null, sorted: true });
  return check.sorted;
};

describe('orders collection', function() {
  var restaurant = { region: {} };

  describe('sorting', function() {
    it('should sort by id by default', function() {

      var orders = new Orders([
        { id: 30, restaurant: restaurant }
      , { id: 14, restaurant: restaurant }
      , { id: 45, restaurant: restaurant }
      ]);

      assert( sortedBy(orders.toJSON(), 'id') );
    });

    it('should sort by type', function() {
      var orders = new Orders([
        { id: 30, restaurant: restaurant }
      , { id: 14, restaurant: restaurant }
      , { id: 45, restaurant: restaurant }
      ]);

      orders.get(30).set('type', 'courier');
      orders.setComparator('type');

      assert( sortedBy(orders.toJSON(), 'type') );
      assert( !sortedBy(orders.toJSON(), 'id') );
    });

    it('should sort by organization', function() {
      var orders = new Orders([
        { id: 30, restaurant: restaurant, user: { organization: 'b' } }
      , { id: 14, restaurant: restaurant, user: { organization: 'c' } }
      , { id: 45, restaurant: restaurant, user: { organization: 'a' } }
      ]);
      orders.setComparator('organization');
      assert( sortedBy(orders.toJSON(), 'user.organization'));
    });

    it('should sort by plan_id', function() {
      var orders = new Orders([
        { id: 30, restaurant: { plan_id: null } }
      , { id: 14, restaurant: { plan_id: 2 } }
      , { id: 45, restaurant: { plan_id: 1 } }
      ]);

      orders.setComparator('plan_id');
      assert( sortedBy(orders.toJSON(), 'restaurant.plan_id'));
      assert( !sortedBy(orders.toJSON(), 'id'));
    });

    it('should sort by restaurant', function() {
      var orders = new Orders([
        { id: 30, restaurant: { name: 'B' } }
      , { id: 14, restaurant: { name: 'C' } }
      , { id: 45, restaurant: { name: 'A' } }
      ]);

      orders.setComparator('restaurant');
      assert( sortedBy(orders.toJSON(), 'restaurant.name'));
      assert( !sortedBy(orders.toJSON(), 'id'));
    });

    it('should sort by user', function() {
      var orders = new Orders([
        { id: 30, restaurant: restaurant, user: { email: 'B' } }
      , { id: 14, restaurant: restaurant, user: { email: 'C' } }
      , { id: 45, restaurant: restaurant, user: { email: 'A' } }
      ]);

      orders.setComparator('user');
      assert( sortedBy(orders.toJSON(), 'user.email'));
      assert( !sortedBy(orders.toJSON(), 'id'));
    });

    it('should sort by datetime', function() {
      var orders = new Orders([
        { id: 30, datetime: '3/19/2015 10:30 AM', restaurant: restaurant }
      , { id: 14, datetime: '5/19/2015 10:30 AM', restaurant: restaurant }
      , { id: 45, datetime: '2/19/2015 10:30 AM', restaurant: restaurant }
      ]);

      orders.setComparator('datetime');
      assert( orders.at(0).id === 45 );
      assert( orders.at(1).id === 30 );
      assert( orders.at(2).id === 14 );
    });

    it('should sort by location', function() {
      var orders = new Orders([
        { id: 30, datetime: '3/19/2015 10:30 AM', restaurant: restaurant, location: { name: 'Spicewood' } }
      , { id: 14, datetime: '5/19/2015 10:30 AM', restaurant: restaurant, location: { name: 'Anderson Lane' } }
      , { id: 45, datetime: '2/19/2015 10:30 AM', restaurant: restaurant, location: { name: 'Xylophone' } }
      ]);

      orders.setComparator('location');
      assert.equal( orders.at(0).id, 14 );
      assert.equal( orders.at(1).id, 30 );
      assert.equal( orders.at(2).id, 45 );
    });
  });
});
