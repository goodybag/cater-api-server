var db = require('../../db');
var assert = require('assert');
var lconfig = require('../../local-config.json');
var moment = require('moment-timezone');

describe('Order Data Access', function() {
  it('should retrieve order with submitted date', function(done) {
    db.orders.findOne( lconfig.testOrderId || 5195, { submittedDate: true }, function(err, order) {
      assert(!err);
      assert(order);
      assert(order.submitted);
      done();
    });
  });

  it('should retrieve order without submitted date by default', function(done) {
    db.orders.findOne( lconfig.testOrderId || 5195, function(err, order) {
      assert(!err);
      assert(order);
      assert(!order.submitted);
      done();
    });
  });

  it('should expose points property', function(done) {
    // Terrible but points depends on submitted date
    // Order points should just be cached instead of calculated every time
    // rewards are viewed
    db.orders.findOne( lconfig.testOrderId || 5195, {submittedDate: true}, function(err, order) {
      assert(!err);
      assert(order);
      assert(order.points);
      done();
    });
  });

  it('should filter by month', function(done) {
    var orders = require('../../lib/stamps/db/orders');
    var sql = orders({ month: 12, submittedDate: true }).get();
    db.orders.find(sql.$query, sql.$options, function(err, orders) {
      assert(!err);
      assert(orders.length);
      var ordersNotInDecember = orders.filter(function(o) {
        return moment( o.submitted ).month() !== 11; // moment is zero-indexed
      });
      assert(!ordersNotInDecember.length);
      done();
    });
  });
});

describe('Order Model', function() {

});
