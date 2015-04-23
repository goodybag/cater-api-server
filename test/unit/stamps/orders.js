var assert      = require('assert');
var moment      = require('moment');
var utils       = require('utils');
var config      = require('../../../config');
var orders      = require('../../../lib/stamps/db/orders');
var fulfillability = require('stamps/orders/fulfillability');

var restaurants = require('stampit')()
  .state({
    lead_times:             []
  , pickup_lead_times:      []
  , hours:                  []
  , delivery_hours:         []
  , delivery_zips:          []
  , locations:              []
  , supported_order_types:  []
  })
  .methods({
    openTwentyFourHour: function(){
      this.hours = utils.range( 0, 7 )
                    .map( function( day ){
                      return { day: day, start_time: '00:00:00', end_time: '24:00:00' }
                    });

     return this;
    }

  , supports: function(){
      [].forEach.call( arguments, function( arg ){
        if ( this.supported_order_types.indexOf( arg ) === -1 ){
          this.supported_order_types.push( arg );
        }
      }.bind( this ));

      return this;
    }

  , open: function( day, start, end ){
      start = start || '00:00:00';
      end = end || '24:00:00';

      this.hours.push({ day: day, start_time: start, end_time: end });

      return this;
    }

  , zip: function( zip, fee ){
      this.delivery_zips.push({ zip: zip, fee: fee });
      return this;
    }

  , leadTime: function( guests, time ){
      this.lead_times.push({ max_guests: guests, lead_time: time });
      return this;
    }
  });

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

    it( '.isFulfillable() test zip is fulfillable', function(){
      var result = fulfillability({
        zip: '78723'
      , restaurant: restaurants()
                      .zip( '78723', 100 )
                      .supports('delivery')
      }).isFulfillable();

      assert( result );
    });

    it( '.isFulfillable() test zip is not fulfillable', function(){
      var result = fulfillability({
        zip: '78724'
      , restaurant: restaurants()
                      .zip( '78723', 100 )
                      .supports('delivery')
      }).isFulfillable();

      assert( !result );
    });

    it( '.isFulfillable() test day is fulfillable', function(){
      var result = fulfillability({
        date: '2015-04-22'
      , restaurant: restaurants()
                      .open(3)
                      .supports('delivery', 'courier')
      }).isFulfillable();

      assert( result );
    });

    it( '.isFulfillable() test day is not fulfillable', function(){
      var result = fulfillability({
        date: '2015-04-22'
      , restaurant: restaurants()
                      .open(4)
                      .supports('delivery', 'courier')
      }).isFulfillable();

      assert( !result );
    });

    it( '.isFulfillable() test lead times is fulfillable', function(){
      // Order in 24 hours
      var date = moment().add('days', 1);

      var result = fulfillability({
        date: date.format('YYYY-MM-DD')
      , time: date.format('HH:mm:ss')
      , guests: 20
      , restaurant: restaurants()
                      .openTwentyFourHour()
                      .supports('delivery', 'courier')
                      .leadTime( 10, 15 * 60 )
                      // Restaurant needs 23 hours
                      .leadTime( 20, 23 * 60 )
      }).isFulfillable();

      assert( result );
    });

    it( '.isFulfillable() test lead times is not fulfillable', function(){
      // Order in 24 hours
      var date = moment().add('days', 1);

      var result = fulfillability({
        date: date.format('YYYY-MM-DD')
      , time: date.format('HH:mm:ss')
      , guests: 20
      , restaurant: restaurants()
                      .openTwentyFourHour()
                      .supports('delivery', 'courier')
                      .leadTime( 10, 15 * 60 )
                      // Restaurant needs 25 hours
                      .leadTime( 20, 25 * 60 )
      }).isFulfillable();

      assert( !result );
    });
  });
});
