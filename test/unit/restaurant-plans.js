var assert    = require('assert');
var config    = require('../../config');
var rPlans    = require('../../public/js/lib/restaurant-plans');

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

    assert.equal( plan(100), 10 );
    assert.equal( plan(1000), 200 );
    assert.equal( plan(2000), 600 );
    assert.equal( plan(3000), 1500 );
  });

  it('application fee - flat', function(){
    var plan = rPlans.flat.getApplicationCut.bind( rPlans.flat, {
      data: { fee: 0.1 }
    });

    assert.equal( plan(100), 10 );
  });
});
