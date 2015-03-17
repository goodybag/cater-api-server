var assert      = require('assert');
var config      = require('../../../config');
var invoices    = require('stamps/user-invoice');

describe('Stamps', function(){
  describe('User Invoice', function(){
    describe('Base', function(){
      it ('.total()', function(){
        var invoice = invoices.create({
          orders: [{ total: 1 }, { total: 2 }, { total: 3 }]
        });

        assert.equal( invoice.total(), 6 );
      });

      it ( '.getBillingPeriodFormatted()', function(){
        var invoice = invoices.create({
          user_id: 1
        , billing_period_start: '2015-01-01'
        , billing_period_end: '2015-01-15'
        });

        assert.equal(
          invoice.getBillingPeriodFormatted()
        , '01/01/2015 - 01/15/2015'
        );
      });
    });
  });
});