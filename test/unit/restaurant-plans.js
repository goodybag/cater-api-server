var assert    = require('assert');
var config    = require('../../config');
var rPlans    = require('../../public/js/lib/restaurant-plans');

var Orders = function( amt, type ){
  var order = {
    type: type || 'delivery'
  , adjustment: { amount: amt, description: 'coupon code' }
  , region: { sales_tax: 0.0825 }
  , restaurant: { sales_tax: 0.0825 }
  , delivery_fee: 0
  , tip: 0
  };

  // If type is courier, we need to make sure we're
  // testing for dfees and tips
  if ( type === 'courier' ){
    order.adjustment.amount -= 20 + 10;
    order.delivery_fee = 20;
    order.tip = 10;
  }

  return order;
};

var FlatPlans = function( fee ){
  return { data: { fee: fee } };
};

describe ('Restaurant Plans', function(){
  it('application fee - tiered', function(){
    var plan = rPlans.tiered.getApplicationCut.bind( rPlans.tiered, {
      data: {
        tiers: [
          { amount: 1000, fee: 0.1 }
        , { amount: 2000, fee: 0.2 }
        , { amount: 3000, fee: 0.3 }
        , { fee: 0.5 }
        ]
      }
    });

    assert.equal( plan( Orders(100) ), 11 );
    assert.equal( plan( Orders(1000) ), 217 );
    assert.equal( plan( Orders(2000) ), 650 );
    assert.equal( plan( Orders(3000) ), 1624 );
  });

  it('application fee - flat', function(){
    var plan = rPlans.flat.getApplicationCut.bind( rPlans.flat, {
      data: { fee: 0.1 }
    });

    assert.equal( plan( Orders(100) ), 11 );
  });

  it('application fee - tiered & courier', function(){
    var plan = rPlans.tiered.getApplicationCut.bind( rPlans.tiered, {
      data: {
        tiers: [
          { amount: 1000, fee: 0.1 }
        , { amount: 2000, fee: 0.2 }
        , { amount: 3000, fee: 0.3 }
        , { fee: 0.5 }
        ]
      }
    });

    // ((subtotal+adj+uadj) * (1+tax)) * fee
    assert.equal( plan( Orders(100, 'courier') ), 8 );
    assert.equal( plan( Orders(1000, 'courier') ), 211 );
    assert.equal( plan( Orders(2000, 'courier') ), 640 );
    assert.equal( plan( Orders(3000, 'courier') ), 1608 );
  });

  it('application fee - flat & courier', function() {
    var plan = rPlans.flat.getApplicationCut.bind( rPlans.flat, {
      data: { fee: 0.1 }
    });

    assert.equal( plan( Orders(3000, 'courier') ), 322 );
  });
});
