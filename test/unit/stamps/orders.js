var assert      = require('assert');
var utils       = require('utils');
var config      = require('../../../config');
var orders      = require('../../../lib/stamps/db/orders');

describe('Orders Stamps', function(){
  it('Should filter by month', function() {
    var sql = orders({ month: 12 }).get();
    assert(sql.$query);
    assert(Array.isArray( sql.$query['submitted_dates.submitted'] ));
    assert(utils.find(sql.$query['submitted_dates.submitted'], function(o){
     return o.$extract.field === 'month';
    }));
  });

  it('Should filter by week', function() {
    var sql = orders({ week: 22 }).get();
    assert(sql.$query);
    assert(Array.isArray( sql.$query['submitted_dates.submitted'] ));
    assert(utils.find(sql.$query['submitted_dates.submitted'], function(o){
     return o.$extract.field === 'week';
    }));
  });

  it('Should filter by year', function() {
    var sql = orders({ year: 12 }).get();
    assert(sql.$query);
    assert(Array.isArray( sql.$query['submitted_dates.submitted'] ));
    assert(utils.find(sql.$query['submitted_dates.submitted'], function(o){
     return o.$extract.field === 'year';
    }));
  });

  it('Should filter by region', function() {
    var filters = {
      region: [
        { id: 1, name:'Austin, TX', active: true }
      , { id: 2, name:'Houston, TX', active: false }
      , { id: 3, name:'Seattle, TX', active: true }
      ]
    };
    var activeRegions = utils
      .chain(filters.region)
      .filter(function(r) { return r.active; })
      .pluck('name')
      .value();
    var sql = orders({ filters: filters }).get();
    assert(sql.$query);
    assert.deepEqual(sql.$query['regions.name']['$in'], activeRegions);
  });

  it('Should join user by default', function() {
    var sql = orders().get();
    assert(sql.$options);
    assert(sql.$options.one);
    assert(utils.filter(sql.$options.one, function(clause) {
      return clause.table === 'users';
    }).length);
  });

  it('Should join restaurant by default', function() {
    var sql = orders().get();
    assert(sql.$options);
    assert(sql.$options.one);
    assert(utils.filter(sql.$options.one, function(clause) {
      return clause.table === 'restaurants';
    }).length);
  });

  it('Should opt-out joining user', function() {
    var sql = orders({ user: false }).get();
    assert(sql.$options);
    assert(sql.$options.one);
    assert(!utils.filter(sql.$options.one, function(clause) {
      return clause.table === 'users';
    }).length);
  });

  it('Should opt-out joining restaurant', function() {
    var sql = orders({ restaurant: false }).get();
    assert(sql.$options);
    assert(sql.$options.one);
    assert(!utils.filter(sql.$options.one, function(clause) {
      return clause.table === 'restaurants';
    }).length);
  });
});
