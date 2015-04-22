var assert      = require('assert');
var utils       = require('utils');
var config      = require('../../../config');
var orders      = require('../../../lib/stamps/db/orders');
var fulfillability = require('stamps/orders/fulfillability');

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

  describe.only('Fulfillability', function() {
    it( '.isFulfillable() empty', function(){
      var result = fulfillability().isFulfillable();
      assert( result );
    });

    it( '.isFulfillable()', function(){
      var result = fulfillability({
        zip: '78723'
      , restaurant: {
          delivery_zips: [{ zip: '78723', fee: 100 }]
        , supported_order_types: ['delivery']
        }
      }).isFulfillable();

      assert( result );
    });

    it( '.isFulfillable()', function(){
      var result = fulfillability({
        zip: '78724'
      , restaurant: {
          delivery_zips: [{ zip: '78723', fee: 100 }]
        , supported_order_types: ['delivery']
        }
      }).isFulfillable();

      assert( !result );
    });

    it( '.isFulfillable()', function(){
      var result = fulfillability({
        date: '2015-04-22'
      , restaurant: {
          hours: [{ day: 3 }]
        , delivery_hours: []
        , supported_order_types: ['delivery', 'courier']
        }
      }).isFulfillable();

      assert( result );
    });

    it( '.isFulfillable()', function(){
      var result = fulfillability({
        date: '2015-04-22'
      , restaurant: {
          hours: [{ day: 4 }]
        , delivery_hours: []
        , supported_order_types: ['delivery', 'courier']
        }
      }).isFulfillable();

      assert( !result );
    });
  });
});
