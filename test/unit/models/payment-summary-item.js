var assert = require('assert');
var Restaurant = require('../../../public/js/app/models/restaurant');
var Order = require('../../../public/js/app/models/order');
var PaymentSummaryItem = require('../../../public/js/app/models/payment-summary-item');
// var Orders = require('../../../public/js/app/collections/orders');
var utils = require('utils');

describe('payment summary item model', function() {
  describe('calcs', function() {
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

    it.only('should not charge gb fee on delivery/tip for courier', function() {
      var psi = new PaymentSummaryItem({
        order: order
      , plan: plan
      , sales_tax: 0.0825
      });
      var netPayout = psi.getNetPayout();
      console.log('netpayout', netPayout);
      assert( false );
    });

    it('should charge gb fee on delivery/tip for delivery', function() {
      assert( false );
    });

    it('should getPreSalesTaxTotal', function() {
      var psi = new PaymentSummaryItem({
        order: order
      , plan: plan
      , sales_tax: 0.0825
      });

      assert(psi.getPreSalesTaxTotal() > 0);
    });
  });

});
