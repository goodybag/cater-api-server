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
});

describe('Order Model', function() {
  
});
