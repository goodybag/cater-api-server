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
      restaurant_total: 100, restaurant_sales_tax: 1
    }), 89 );

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
      restaurant_total: 100, restaurant_sales_tax: 1
    }), 49 );

    assert.equal( plan({
      restaurant_total: 100
    }), 50 );

    assert.equal( plan({
      restaurant_total: 1000
    }), 500 );
  });

  it ('application fee - tiered', function(){
    var plan = rPlans.tiered.getApplicationFee.bind( rPlans.tiered, {
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
      restaurant_total: 2343, restaurant_sales_tax: 123
    }), 826);

    assert.equal( plan({
      restaurant_total: 1231, restaurant_sales_tax: 123
    }), 369);

    assert.equal( plan({
      restaurant_total: 10, restaurant_sales_tax: 123
    }), 124);

    assert.equal( plan({
      restaurant_total: 10000, restaurant_sales_tax: 123
    }), 5123);
  });

  it ('application fee - flat', function(){
    var plan = rPlans.flat.getApplicationFee.bind( rPlans.flat, {
      data: { fee: 0.25 }
    });

    assert.equal( plan({
      restaurant_total: 100, restaurant_sales_tax: 13
    }), 38);

    assert.equal( plan({
      restaurant_total: 100
    }), 25);

    assert.equal( plan({
      restaurant_total: 8435, restaurant_sales_tax: 4689
    }), 6798);
  });

  it ('application fee - tiered & courier', function(){
    var plan = rPlans.tiered.getApplicationFee.bind( rPlans.tiered, {
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
      type:                   'courier'
    , restaurant_total:       2343
    , restaurant_sales_tax:   123
    }), 826);

    assert.equal( plan({
      type:                   'courier'
    , delivery_fee:           546
    , restaurant_total:       2343
    , restaurant_sales_tax:   123
    }), 1372);


    assert.equal( plan({
      type:                   'courier'
    , delivery_fee:           546
    , tip:                    99
    , restaurant_total:       2343
    , restaurant_sales_tax:   123
    }), 1471);
  });

  it ('application fee - flat & courier', function() {
    var plan = rPlans.flat.getApplicationFee.bind( rPlans.flat, {
      data: { fee: 0.25 }
    });

    assert.equal( plan({
      type:                   'courier'
    , restaurant_total:       100
    , restaurant_sales_tax:   13
    }), 38);

    assert.equal( plan({
      type:                   'courier'
    , restaurant_total:       100
    , restaurant_sales_tax:   13
    , delivery_fee:           984
    }), 1022);

    assert.equal( plan({
      type:                   'courier'
    , restaurant_total:       100
    , restaurant_sales_tax:   13
    , delivery_fee:           984
    , tip:                    311
    }), 1333);
  });
});
