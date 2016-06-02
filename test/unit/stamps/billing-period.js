var assert = require('assert');
var moment = require('moment-timezone');
var BillingPeriod = require('stamps/datetime/billing-period');

describe('Stamps', ()=>{
  describe('BillingPeriod', ()=>{
    it('.getMosqlRangeQuery()', ()=>{
      var period = BillingPeriod.create({
        startDate: '2016-01-01'
      , endDate: '2016-01-15'
      });

      assert.deepEqual( period.getMosqlRangeQuery(), {
        $gte: '2016-01-01'
      , $lt: '2016-01-16'
      });
    });

    it('.next()', ()=>{
      var period = BillingPeriod.create({
        startDate: '2016-01-01'
      , endDate: '2016-01-15'
      });

      var next = period.next();

      assert.equal( next.startDate, '2016-01-16' );
      assert.equal( next.endDate, '2016-01-31' );

      period = BillingPeriod.create({
        startDate: '2016-03-16'
      , endDate: '2016-03-31'
      });

      next = period.next();

      assert.equal( next.startDate, '2016-04-01' );
      assert.equal( next.endDate, '2016-04-15' );
    });

    it('.previous()', ()=>{
      var period = BillingPeriod.create({
        startDate: '2016-01-01'
      , endDate: '2016-01-15'
      });

      var previous = period.previous();

      assert.equal( previous.startDate, '2015-12-16' );
      assert.equal( previous.endDate, '2015-12-31' );
    });
  });
});
