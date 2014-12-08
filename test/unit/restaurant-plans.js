var assert    = require('assert');
var config    = require('../../config');
var rPlans    = require('../../public/js/lib/restaurant-plans');

describe ('Restaurant Plans', function(){
  it ('tiered', function(){
    var plan = rPlans.tiered.getPayoutForOrder.bind( rPlans.tiered, {
      data: {
        tiers: [
          { amount: 1000, fee: 0.1 }
        , { amount: 2000, fee: 0.2 }
        , { amount: 3000, fee: 0.3 }
        , { fee: 0.5 }
        ]
      }
    });

    assert.equal( plan({
      restaurant_total: 100
    }), 90 );

    assert.equal( plan({
      restaurant_total: 1100
    }), 880 );

    assert.equal( plan({
      restaurant_total: 2100
    }), 1470 );

    assert.equal( plan({
      restaurant_total: 3000
    }), 1500 );

    assert.equal( plan({
      restaurant_total: 5000
    }), 2500 );
  });

  it ('flat', function(){
    var plan = rPlans.flat.getPayoutForOrder.bind( rPlans.flat, {
       data: { fee: 0.5 }
    });

    assert.equal( plan({
      restaurant_total: 100
    }), 50 );

    assert.equal( plan({
      restaurant_total: 1000
    }), 500 );
  });
});