var db = require('../../db');
var assert = require('assert');

describe('Order Data Access', function() {
  it('should retrieve order with submitted date', function(done) {
    db.orders.findOne(5195, { submittedDate: true }, function(err, order) {
      assert(!err);
      assert(order);
      assert(order.submitted);
      done();
    });
  });

  it('should retrieve order without submitted date by default', function(done) {
    db.orders.findOne(5195, function(err, order) {
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
    db.orders.findOne(5195, {submittedDate: true}, function(err, order) {
      assert(!err);
      assert(order);
      assert(order.points);
      done();
    });
  });
});

describe('Order Model', function() {

});

