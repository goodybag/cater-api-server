var assert      = require('assert');
var moment      = require('moment');
var utils       = require('utils');
var config      = require('../../../config');
var orders      = require('stamps/orders');
var OrderCharge = require('stamps/orders/charge');
var fulfillability = require('stamps/orders/fulfillability');
orders.db        = require('../../../lib/stamps/db/orders')

var restaurants = require('stampit')()
  .state({
    lead_times:             []
  , pickup_lead_times:      []
  , hours:                  []
  , delivery_hours:         []
  , delivery_zips:          []
  , locations:              []
  , supported_order_types:  []
  , region: {
      delivery_services:    []
    }
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

  , deliveryService: function( ds ){
      this.region.delivery_services.push( ds );
      return this;
    }
  });

describe('Orders Stamps', function(){
  it('.getTax()', function(){
    var order = orders({
      region: { sales_tax: 0.0825 }
    , items: [{ price: 100, quantity: 1 }]
    });

    assert.equal( order.getTax(), 9 );
  });

  it('.getSubTotal()', function(){
    var order = orders({
      items: [
        { price: 100, quantity: 1 }
      , { price: 200, quantity: 3 }
      , { price: 100, quantity: 3, options_sets: [
            { options: [{ state: true, price: 50 }, { state: false, price: 10 }] }
          ]
        }
      ]
    });

    assert.equal( order.getSubTotal(), 1150 );
  });

  it('.getTotal()', function(){
    var order = orders({
      region: { sales_tax: 0.0825 }
    , items: [
        { price: 100, quantity: 1 }
      , { price: 200, quantity: 3 }
      ]
    , adjustment: -100
    , userAdjustment: -50
    , tip: 50
    , delivery_fee: 100
    });

    assert.equal( order.getTotal(), 746 );
  });

  it('Should filter by month', function() {
    var sql = orders.db({ month: 12 }).get();
    assert(sql.$query);
    assert(Array.isArray( sql.$query['submitted_dates.submitted'] ));
    assert(utils.find(sql.$query['submitted_dates.submitted'], function(o){
     return o.$extract.field === 'month';
    }));
  });

  it('Should filter by week', function() {
    var sql = orders.db({ week: 22 }).get();
    assert(sql.$query);
    assert(Array.isArray( sql.$query['submitted_dates.submitted'] ));
    assert(utils.find(sql.$query['submitted_dates.submitted'], function(o){
     return o.$extract.field === 'week';
    }));
  });

  it('Should filter by year', function() {
    var sql = orders.db({ year: 12 }).get();
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
    var sql = orders.db({ filters: filters }).get();
    assert(sql.$query);
    assert.deepEqual(sql.$query['regions.name']['$in'], activeRegions);
  });

  it('Should join user by default', function() {
    var sql = orders.db().get();
    assert(sql.$options);
    assert(sql.$options.one);
    assert(utils.filter(sql.$options.one, function(clause) {
      return clause.table === 'users';
    }).length);
  });

  it('Should join restaurant by default', function() {
    var sql = orders.db().get();
    assert(sql.$options);
    assert(sql.$options.one);
    assert(utils.filter(sql.$options.one, function(clause) {
      return clause.table === 'restaurants';
    }).length);
  });

  it('Should opt-out joining user', function() {
    var sql = orders.db({ user: false }).get();
    assert(sql.$options);
    assert(sql.$options.one);
    assert(!utils.filter(sql.$options.one, function(clause) {
      return clause.table === 'users';
    }).length);
  });

  it('Should opt-out joining restaurant', function() {
    var sql = orders.db({ restaurant: false }).get();
    assert(sql.$options);
    assert(sql.$options.one);
    assert(!utils.filter(sql.$options.one, function(clause) {
      return clause.table === 'restaurants';
    }).length);
  });

  describe('Fulfillability', function() {
    it( '.isFulfillable() empty', function(){
      var result = fulfillability().isFulfillable();
      assert( result );
    });

    it( '.isFulfillable() test zip is fulfillable', function(){
      var result = fulfillability({
        timezone: 'America/Chicago'
      , zip: '78723'
      , restaurant: restaurants()
                      .zip( '78723', 100 )
                      .supports('delivery')
      }).isFulfillable();

      assert( result );
    });

    it( '.isFulfillable() test zip is fulfillable because of delivery service', function(){
      var result = fulfillability({
        timezone: 'America/Chicago'
      , zip: '78723'
      , restaurant: restaurants({ zip: '78722' })
                      .deliveryService({
                        name: 'Blah Courier'
                      , zips: [
                          { "from": '78722', "to": '78723', price: 100 }
                        ]
                      })
                      .supports('delivery', 'courier')
      }).isFulfillable();

      assert( result );
    });

    it( '.isFulfillable() test zip is not fulfillable', function(){
      var result = fulfillability({
        timezone: 'America/Chicago'
      , zip: '78724'
      , restaurant: restaurants()
                      .zip( '78723', 100 )
                      .supports('delivery')
      }).isFulfillable();

      assert( !result );
    });

    it( '.isFulfillable() test day is fulfillable', function(){
      var result = fulfillability({
        timezone: 'America/Chicago'
      , date: '2015-04-22'
      , restaurant: restaurants()
                      .open(3)
                      .supports('delivery', 'courier')
      }).isFulfillable();

      assert( result );
    });

    it( '.isFulfillable() test day is not fulfillable', function(){
      var result = fulfillability({
        timezone: 'America/Chicago'
      , date: '2015-04-22'
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
        timezone: 'America/Chicago'
      , date: date.format('YYYY-MM-DD')
      , time: date.format('HH:mm a')
      , guests: 20
      , restaurant: restaurants()
                      .openTwentyFourHour()
                      .supports('delivery', 'courier')
                      .leadTime( 10, 15 * 60 )
                      // Restaurant needs 23 hours
                      .leadTime( 20, 23 * 60 )
      });

      assert( result.isFulfillable() );
    });

    it( '.isFulfillable() test lead times is not fulfillable', function(){
      // Order in 24 hours
      var date = moment().add('days', 1);

      var result = fulfillability({
        timezone: 'America/Chicago'
      , date: date.format('YYYY-MM-DD')
      , time: date.format('HH:mm a')
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

    it( '.isFulfillable() test lead times is not fulfillable because date is in the past', function(){
      // Order in -24 hours
      var date = moment().add('days', -1);

      var result = fulfillability({
        timezone: 'America/Chicago'
      , date: date.format('YYYY-MM-DD')
      , time: date.format('HH:mm a')
      , guests: 20
      , restaurant: restaurants()
                      .openTwentyFourHour()
                      .supports('delivery', 'courier')
                      .leadTime( 10, 15 * 60 )
                      // Restaurant needs 23 hours
                      .leadTime( 20, 23 * 60 )
      }).isFulfillable();

      assert( !result );
    });
  });

  describe('Amenities', function(){
    it('.getTotal() disabled', function() {
      var amenity = orders.amenity({
        guests: 12, price: 100, scale: 'flat', enabled: false
      });

      assert.equal( amenity.getTotal(), 0 );
    });

    it('.getTotal() flat', function() {
      var amenity = orders.amenity({
        guests: 12, price: 100, scale: 'flat', enabled: true
      });

      assert.equal( amenity.getTotal(), 100 );
    });

    it('.getTotal() multiply', function() {
      var amenity = orders.amenity({
        guests: 12, price: 100, scale: 'multiply', enabled: true
      });

      assert.equal( amenity.getTotal(), 1200 );
    });

    it('.getTotal() throw error invalid scale', function() {
      var amenity = orders.amenity({
        guests: 12, price: 100, scale: 'derp', enabled: false
      });

      assert.throws( amenity.getTotal() );
    });
  });

  describe('Items', function(){
    it('.getTotal()', function(){
      var item = orders.item({
        price: 100
      , quantity: 5
      });

      assert.equal( item.getTotal(), 500 );
    });

    it('.getTotal() with options', function(){
      var item = orders.item({
        price: 100
      , quantity: 2
      , options_sets: [
          { options:  [ { price: 50, state: true }
                      , { price: 50, state: false }
                      ]
          }
        , { options:  [ { price: 50, state: false }
                      , { price: 100, state: true }
                      ]
          }
        , { options:  [ { price: 50, state: false }
                      , { price: 100, state: false }
                      ]
          }
        ]
      });

      assert.equal( item.getTotal(), 500 );
    });
  });

  describe('Charges', function(){
    var DefaultOrderCharge = OrderCharge
      .state({
        type: 'delivery'
      , region: { sales_tax: 0.0825 }
      , restaurant: {
          region: { sales_tax: 0.0825 }
        , plan: { type: 'flat', data: { fee: 0.1 } }
        }
      , items: [
          { price: 100, quantity: 1 }
        , { price: 200, quantity: 1 }
        ]
      , adjustment: -100
      , userAdjustment: -50
      , tip: 50
      , delivery_fee: 100
      });

    it('.getRestaurantCut()', function(){
      var oc = DefaultOrderCharge();
      assert.equal( oc.getRestaurantCut(), 306 );
    });

    it('.getRestaurantCut() - courier', function(){
      var oc = DefaultOrderCharge({ type: 'courier' });
      assert.equal( oc.getRestaurantCut(), 156 );
    });

    it('.getApplicationCut()', function(){
      var oc = DefaultOrderCharge();
      assert.equal( oc.getApplicationCut(), 44 );
    });

    it('.getApplicationCut()', function(){
      var oc = DefaultOrderCharge({ type: 'courier' });
      assert.equal( oc.getApplicationCut(), 194 );
    });
  });
});
