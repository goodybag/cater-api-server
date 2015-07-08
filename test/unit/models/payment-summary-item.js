var assert              = require('assert');
var Restaurant          = require('../../../public/js/app/models/restaurant');
var Order               = require('../../../public/js/app/models/order');
var PaymentSummaryItem  = require('../../../public/js/app/models/payment-summary-item');
var utils               = require('utils');

describe('payment summary item model', function() {
  var plan = {
    type: 'flat'
  , data: { fee: 0.12 }
  };

  var restaurant = { region: {} };

  var order = new Order({
    restaurant: restaurant
  , type: 'courier'
  , sub_total: 123
  , adjustment_amount: 224
  , delivery_fee: 17
  , tip: 9
  });

  it('should not charge gb fee on delivery/tip for courier', function() {
    order.set('type', 'courier');
    var psi = new PaymentSummaryItem({
      order: order
    , plan: plan
    , sales_tax: 0.0825
    });
    psi.updatePropertiesBasedOnOrder(order); // set gb_fee
    assert.equal( 302, 276 );
  });

  it('should charge gb fee on delivery/tip for delivery', function() {
    order.set('type', 'delivery');
    var psi = new PaymentSummaryItem({
      order: order
    , plan: plan
    , sales_tax: 0.0825
    });
    psi.updatePropertiesBasedOnOrder(order); // set gb_fee
    assert.equal( psi.getNetPayout(), 325 );
  });
});
