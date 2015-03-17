var analytics = require('../../../lib/stamps/analytics');
var assert = require('assert');

describe('Analytics', function() {
  describe('period.js', function() {
    it('Should format caption given month & year', function() {
      var query = {
        month: 12
      , year: 2014
      };
      var caption = analytics({ query: query }).getCaption();
      assert(caption === 'Month of Dec 1st - Dec 31st 2014');
    });

    it('Should format caption given week & year', function() {
      var query = {
        week: 3
      , year: 2014
      };
      var caption = analytics({ query: query }).getCaption();
      assert(caption === 'Week 3 of 2014');
    });

    it('Should format prev, next pager querystrings given month & year', function() {
      var query = {
        month: 6
      , year: 2014
      };
      var stamp = analytics({ query: query });
      var prev = stamp.getPrevious();
      var next = stamp.getNext();
      assert(prev === 'month=5&year=2014');
      assert(next === 'month=7&year=2014');
    });

    it('Should format prev, next pager querystrings given week & year', function() {
      var query = {
        week: 3
      , year: 2014
      };
      var stamp = analytics({ query: query });
      var prev = stamp.getPrevious();
      var next = stamp.getNext();
      assert(prev === 'week=2&year=2014');
      assert(next === 'week=4&year=2014');
    });

    it('Should handle pager edge cases where period wraps around years', function() {
      var query = {
        week: 1
      , year: 2014
      };
      var stamp = analytics({ query: query });
      var prev = stamp.getPrevious();
      var next = stamp.getNext();
      assert(prev === 'week=52&year=2013');
      assert(next === 'week=2&year=2014');

      query = {
        month: 12
      , year: 2014
      };
      stamp = analytics({ query: query });
      prev = stamp.getPrevious();
      next = stamp.getNext();
      assert(prev === 'month=11&year=2014');
      assert(next === 'month=1&year=2015');
    });

    it('Should default to querying by month', function() {
      var stamp = analytics({ query: {} });
      var caption = stamp.getCaption();
      assert(caption.indexOf('Month') >= 0);
    });

    it('Should return period object', function() {
      var period = analytics().getPeriod();
      assert(period.caption);
      assert(period.previous);
      assert(period.next);
    });
  });
});
