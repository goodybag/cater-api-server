var assert = require('assert');
var moment = require('moment-timezone');
var stamps = {
  datetime: require('stamps/datetime')
};

describe('Stamps', function() {
  describe('base', function() {
    it('defaults should be set', function() {
      var dt = stamps.datetime();
      assert(dt.datetime);
      assert(!dt.timezone);
      assert(dt.businessHours && dt.businessHours.start && dt.businessHours.end);
    });

    it('.toISOString should return string', function() {
      var str = stamps.datetime({
        datetime: '2015-11-05 14:15'
      , timezone: 'America/New_York'
      }).toISOString();
      assert(typeof str === 'string');
    });
  });

  describe('billing', function() {
    it('.getBillingPeriod()', function(){
      var period = stamps.datetime({
        datetime: '2015-11-05 00:00:00'
      }).getBillingPeriod();

      assert.equal( '2015-11-01', period.startDate );
      assert.equal( '2015-11-15', period.endDate );
    });

    it('.getBillingPeriod()', function(){
      var period = stamps.datetime({
        datetime: '2015-11-25 00:00:00'
      }).getBillingPeriod();

      assert.equal( '2015-11-16', period.startDate );
      assert.equal( '2015-11-30', period.endDate );
    });

    it('.getMosqlRangeQuery()', function(){
      var period = stamps.datetime({
        datetime: '2015-11-05 00:00:00'
      }).getBillingPeriod();

      assert.deepEqual( period.getMosqlRangeQuery(), {
        $gt: '2015-11-01'
      , $lt: '2015-11-16'
      });
    });

    it('.getPreviousBillingPeriod()', function(){
      var period = stamps.datetime({
        datetime: '2015-11-05 00:00:00'
      }).getPreviousBillingPeriod();

      assert.equal( '2015-10-16', period.startDate );
      assert.equal( '2015-10-31', period.endDate );
    });

    it('.getPreviousBillingPeriod()', function(){
      var period = stamps.datetime({
        datetime: '2015-11-25 00:00:00'
      }).getPreviousBillingPeriod();

      assert.equal( '2015-11-01', period.startDate );
      assert.equal( '2015-11-15', period.endDate );
    });

    it('.isStartOfBillingPeriod()', function(){
      var date = stamps.datetime({
        datetime: '2015-11-1 00:00:00'
      });

      assert.equal( date.isStartOfBillingPeriod(), true );
    });

    it('.isStartOfBillingPeriod()', function(){
      var date = stamps.datetime({
        datetime: '2015-11-16 00:00:00'
      });

      assert.equal( date.isStartOfBillingPeriod(), true );
    });

    it('.isStartOfBillingPeriod()', function(){
      var date = stamps.datetime({
        datetime: '2015-11-10 00:00:00'
      });

      assert.equal( date.isStartOfBillingPeriod(), false );
    });

    it('.isStartOfBillingPeriod()', function(){
      var date = stamps.datetime({
        datetime: '2015-11-17 00:00:00'
      });

      assert.equal( date.isStartOfBillingPeriod(), false );
    });
  });

  describe('business-hours', function() {
    it('.getWorkingTime should return the earliest time during business hours given a datetime that is after hours', function() {
      var datetime = stamps.datetime({
        datetime: '2015-01-15 03:00 AM'
      , businessHours: { start: 8, end: 22 }
      }).getWorkingTime();
      assert(datetime.hour() === 8);
    });

    it('.getWorkingTime should return now given datetime during business hours', function() {
      var datetime = stamps.datetime({
        datetime: '2015-01-15 12:00 PM'
      , businessHours: { start: 8, end : 22 }
      }).getWorkingTime();
      assert(datetime.hour() === 12);
    });

    it('.getWorkingTime should return earliest datetime next day given after hours', function() {
      var datetime = stamps.datetime({
        datetime: '2015-01-15 23:00'
      , businessHours: { start: 8, end : 22 }
      }).getWorkingTime();
      assert(datetime.hour() === 8);
      assert(datetime.date() === 16); // past end time, rollover to next day
    });

    it('.getWorkingTime should return earliest datetime with timezone conversion', function() {
      // This test case ensures that dates from any server can be
      // tested against business hours.
      // i.e. checking if now() is within business hours
      // `stamps.datetime({ businessHours: hours }).getWorkingTime(order.timezone);`

      var datetime = stamps.datetime({
        datetime: '2015-01-15 09:00 GMT+0'
      , businessHours: { start: 8, end : 22 }
      }).tz('America/Chicago').getWorkingTime();

      // 3:00 AM Central should return 8:00 AM
      assert(datetime.hour() === 8);
      assert(datetime.date() === 15);
    });

    it('.getWorkingTime should return datetime with timezone conversion', function() {
      var datetime = stamps.datetime({
        datetime: '2015-01-15 23:00 GMT+0'
      , businessHours: { start: 8, end : 22 }
      }).tz('America/Chicago').getWorkingTime();

      // 5:00 PM Central should return 5:00 PM since it's within business hours
      assert(datetime.hour() === 17);
      assert(datetime.date() === 15);
    });

    it('.isWeekend should return true for weekend', function() {
      var isWeekend = stamps.datetime({
        datetime: '2015-01-17 12:00:00'
      }).isWeekend();
      assert(isWeekend);
    });

    it('.isWeekend should return false for a weekday', function() {
      var isWeekend = stamps.datetime({
        datetime: '2015-01-15 12:00:00'
      }).isWeekend();
      assert(!isWeekend);
    });

    it('.isWeekday should return false for weekday', function() {
      var isWeekday = stamps.datetime({
        datetime: '2015-01-17 12:00:00'
      }).isWeekday();
      assert(!isWeekday);
    });

    it('.isWeekday should return true for a weekday', function() {
      var isWeekday = stamps.datetime({
        datetime:  '2015-01-15 12:00:00'
      }).isWeekday();
      assert(isWeekday);
    });

    it('.isAfterHours should handle edge cases', function() {
      var dt;
      var businessHours = { start: 8, end: 18 };
      // ensure that business hours are [start, end)
      dt = stamps.datetime({
        datetime: '2013-02-08 7:59:00'
      , businessHours: businessHours
      });
      assert( dt.isAfterHours() );

      dt = stamps.datetime({
        datetime: '2013-02-08 08:00:00'
      , businessHours: businessHours
      });
      assert( !dt.isAfterHours() );

      dt = stamps.datetime({
        datetime: '2013-02-08 08:01:00'
      , businessHours: businessHours
      });
      assert( !dt.isAfterHours() );

      dt = stamps.datetime({
        datetime: '2013-02-08 17:59:00'
      , businessHours: businessHours
      });
      assert( !dt.isAfterHours() );

      dt = stamps.datetime({
        datetime: '2013-02-08 18:00:00'
      , businessHours: businessHours
      });
      assert( dt.isAfterHours() );

      dt = stamps.datetime({
        datetime: '2013-02-08 18:01:00'
      , businessHours: businessHours
      })
      assert( dt.isAfterHours() );
    });

    it('.isAfterHours should return true for late night times', function() {
      var datetime = stamps.datetime({
        datetime: '2013-02-08 20:30:00' // 8:30pm
      , businessHours: { start: 8, end: 18 }
      });
      var result = datetime.isAfterHours( );
      assert(result);
    });

    it('.isAfterHours should return false for day times', function() {
      var datetime = stamps.datetime({
        datetime: '2013-02-08 12:00:00' // 12:00pm
      , businessHours: { start: 8, end: 18 }
      });
      var result = !datetime.isAfterHours();
      assert(result);
    });

    it('.duringBusinessHours should return true for business hours', function(){
      var datetime = stamps.datetime({
        datetime: '2013-02-08 12:00:00' // 12:00pm
      , businessHours: { start: 8, end: 18 }
      });
      var result = datetime.duringBusinessHours();
      assert(result);
    });

    it('.duringBusinessHours should return false for hours outside biz hours', function() {
      var datetime = stamps.datetime({
        datetime: '2013-02-08 20:30:00' // 8:30pm
      , businessHours: { start: 8, end: 18 }
      });
      var result = !datetime.duringBusinessHours();
      assert(result);
    });

    it('.isWithin should return true', function() {
      var isWithin = stamps.datetime({
        datetime: moment().add(3, 'hours')
      }).isWithin( 12, 'hours' );
      assert(isWithin);
    });

    it('.isWithin should return false', function() {
      var isWithin = stamps.datetime({
        datetime: moment().add(15, 'hours')
      }).isWithin( 12, 'hours' );
      assert(!isWithin);
    });
  });
});
