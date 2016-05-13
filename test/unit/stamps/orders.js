var assert      = require('assert');
var moment      = require('moment-timezone');
var stampit     = require('stampit');
var utils       = require('../../../utils');
var config      = require('../../../config');
var orders      = require('stamps/orders');
var OrderCharge = require('stamps/orders/charge');
var PMSItem     = require('stamps/orders/payment-summary-item');
var fulfillability = require('stamps/orders/fulfillability');
orders.db        = require('../../../lib/stamps/db/orders');
var OrderRewards = require('stamps/orders/rewards');

var restaurants = require('stampit')()
  .state({
    minimum_order:          0
  })
  .enclose(function(){
    utils.extend( this, {
      lead_times:             []
    , pickup_lead_times:      []
    , hours:                  []
    , delivery_hours:         []
    , delivery_zips:          []
    , locations:              []
    , supported_order_types:  []
    , events:                 []
    , region: {
        delivery_services:    []
      }
    });
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

  , addCalendarEvent: function( evt ){
      this.events.push( evt );
      return this;
    }

  , minOrder: function( amt ){
      this.minimum_order = amt;
      return this;
    }
  });

describe('Orders Stamps', function(){
  it('.getTax()', function(){
    var order = orders({
      restaurant: {
        region: { sales_tax: 0.0825 }
      }
    , items: [{ price: 100, quantity: 1 }]
    , delivery_fee: 100
    });

    assert.equal( order.getTax(), 17 );
  });

  it('.getAmenityTotal', function(){
    var order = orders({
      guests: 7
    , amenities: [
        { price: 100, scale: 'flat', enabled: true }
      , { price: 100, scale: 'flat', enabled: false }
      , { price: 300, scale: 'multiply', enabled: true }
      ]
    });

    assert.equal( order.getAmenityTotal(), 2200 );
  });

  it('.getItemTotal', function(){
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

    assert.equal( order.getItemTotal(), 1150 );
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
    , guests: 7
    , amenities: [
        { price: 100, scale: 'flat', enabled: true }
      , { price: 100, scale: 'flat', enabled: false }
      , { price: 300, scale: 'multiply', enabled: true }
      ]
    });

    assert.equal( order.getSubTotal(), 3350 );
  });

  it('.getSubTotal() Cached', function(){
    var order = orders.Cached({
      sub_total: 100
    , guests: 7
    });

    assert.equal( order.getSubTotal(), 100 );
  });

  it('.getTotal()', function(){
    var order = orders({
      restaurant: {
        region: { sales_tax: 0.0825 }
      , no_contract_fee: 0
      }
    , items: [
        { price: 100, quantity: 1 }
      , { price: 200, quantity: 3 }
      ]
    , amenities: [
        { price: 7, scale: 'flat', enabled: true }
      , { price: 2, scale: 'multiply', enabled: true }
      , { price: 1, scale: 'multiply', enabled: false }
      ]
    , guests: 5
    , adjustment_amount: -100
    , user_adjustment_amount: -50
    , tip: 50
    , delivery_fee: 100
    });

    assert.equal( order.getTotal(), 772 );
  });

  it('.getTotal() with Cached SubTotal', function(){
    var order = orders.Cached({
      restaurant: {
        region: { sales_tax: 0.0825 }
      , no_contract_fee: 0
      }
    , sub_total: 717
    , guests: 5
    , adjustment_amount: -100
    , user_adjustment_amount: -50
    , tip: 50
    , delivery_fee: 100
    });

    assert.equal( order.getTotal(), 772 );
  });

  it('.getTotal() with tax exempt user', function(){
    var order = orders({
      restaurant: {
        region: { sales_tax: 0.0825 }
      , no_contract_fee: 0
      }
    , user: { is_tax_exempt: true }
    , items: [
        { price: 100, quantity: 1 }
      , { price: 200, quantity: 3 }
      ]
    , amenities: [
        { price: 7, scale: 'flat', enabled: true }
      , { price: 2, scale: 'multiply', enabled: true }
      , { price: 1, scale: 'multiply', enabled: false }
      ]
    , guests: 5
    , adjustment_amount: -100
    , user_adjustment_amount: -50
    , tip: 50
    , delivery_fee: 100
    });

    assert.equal( order.getTotal(), 717 );
  });

  it('.getPriorityAccountCost()', function(){
    var order = orders({
      restaurant: {
        region: { sales_tax: 0.0825 }
      , no_contract_fee: 0
      }
    , user: { is_tax_exempt: false }
    , priority_account_price_hike_percentage: 0.1
    , items: [
        { price: 100, quantity: 1 }
      , { price: 200, quantity: 3 }
      ]
    , guests: 5
    , adjustment_amount: -100
    , user_adjustment_amount: -50
    , tip: 50
    , delivery_fee: 100
    });

    assert.equal( order.getPriorityAccountCost(), 70 );
  });

  it('.getDeliveryFee()', function(){
    var order = orders({
      delivery_fee: 100
    });

    assert.equal( order.getDeliveryFee(), 100 );

    order.waive_delivery_fee = true;

    assert.equal( order.getDeliveryFee(), 0 );
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

    var tztests = {
      timezones: ['America/Chicago', 'America/Los_Angeles', 'UTC']
    , tests: {
        '.isFulfillable() test zip is fulfillable': function( timezone ){ return function(){
          var result = fulfillability({
            timezone: 'America/Chicago'
          , zip: '78723'
          , restaurant: restaurants()
                          .zip( '78723', 100 )
                          .supports('delivery')
          });

          assert( result.isFulfillable() );
        }}

      , '.isFulfillable() test zip is fulfillable because of delivery service': function( timezone ){ return function(){
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
        }}

      , '.isFulfillable() test zip is not fulfillable': function( timezone ){ return function(){
          var result = fulfillability({
            timezone: 'America/Chicago'
          , zip: '78724'
          , restaurant: restaurants()
                          .zip( '78723', 100 )
                          .supports('delivery')
          }).isFulfillable();

          assert( !result );
        }}

      , '.isFulfillable() test day is fulfillable': function( timezone ){ return function(){
          // Order in 24 hours
          var date = moment.tz('America/Chicago').add(1, 'days');

          var result = fulfillability({
            timezone: 'America/Chicago'
          , datetime: date.format('YYYY-MM-DD hh:mm:ss')
          , restaurant: restaurants()
                          .open( date.day() )
                          .leadTime( 5, 60 )
                          .supports('delivery', 'courier')
          });

          assert( result.isFulfillable() );
        }}

      , '.isFulfillable() test day is not fulfillable': function( timezone ){ return function(){
          var result = fulfillability({
            timezone: 'America/Chicago'
          , date: '2015-04-22'
          , restaurant: restaurants()
                          .open(4)
                          .supports('delivery', 'courier')
          }).isFulfillable();

          assert( !result );
        }}

      , '.isFulfillable() test lead times is fulfillable': function( timezone ){ return function(){
          // Order in 24 hours
          var date = moment.tz('America/Chicago').add(1, 'days');

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
        }}

      , '.isFulfillable() test lead times is not fulfillable': function( timezone ){ return function(){
          // Order in 24 hours
          var date = moment.tz('America/Chicago').add(1, 'days');

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
          });

          assert( !result.isFulfillable() );
        }}

      , '.isFulfillable() test lead times is not fulfillable because date is in the past': function( timezone ){ return function(){
          // Order in -24 hours
          var date = moment.tz('America/Chicago').add(-1, 'days');

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
        }}

      , '.isFulfillable() is false because of calendar event': function( timezone ){ return function(){
          // Order in -24 hours
          var date = moment.tz('America/Chicago').add(2, 'days');

          var result = fulfillability({
            timezone: 'America/Chicago'
          , date: date.format('YYYY-MM-DD')
          , time: date.format('HH:mm a')
          , guests: 20
          , restaurant: restaurants()
                          .openTwentyFourHour()
                          .supports('delivery', 'courier')
                          .leadTime( 10, 15 * 60 )
                          .leadTime( 20, 23 * 60 )
                          .addCalendarEvent({
                            closed: true
                          , during: {
                              start: {
                                inclusive: true
                              , value: date.add(-3, 'days').format('YYYY-MM-DD')
                              }
                            , end: {
                                inclusive: false
                              , value: date.add(6, 'days').format('YYYY-MM-DD')
                              }
                            }
                          })
          }).isFulfillable();

          assert( !result );
        }}

      , '.isFulfillable() is true even with a calendar event': function( timezone ){ return function(){
          // Order in -24 hours
          var date = moment.tz('America/Chicago').add(2, 'days');

          var result = fulfillability({
            timezone: 'America/Chicago'
          , date: date.format('YYYY-MM-DD')
          , time: date.format('HH:mm a')
          , guests: 20
          , restaurant: restaurants()
                          .openTwentyFourHour()
                          .supports('delivery', 'courier')
                          .leadTime( 10, 15 * 60 )
                          .leadTime( 20, 23 * 60 )
                          .addCalendarEvent({
                            closed: true
                          , during: {
                              start: {
                                inclusive: true
                              , value: date.add(-3, 'days').format('YYYY-MM-DD')
                              }
                            , end: {
                                inclusive: false
                              , value: date.add(2, 'days').format('YYYY-MM-DD')
                              }
                            }
                          })
          }).isFulfillable();

          assert( result );
        }}

      , '.isFulfillable() minimum order': function( timezone ){ return function(){
          // Order in -24 hours
          var date = moment.tz('America/Chicago').add(2, 'days');

          var result = fulfillability({
            timezone: 'America/Chicago'
          , date: date.format('YYYY-MM-DD')
          , time: date.format('HH:mm a')
          , guests: 20
          , items: []
          , restaurant: restaurants()
                          .openTwentyFourHour()
                          .supports('delivery', 'courier')
                          .leadTime( 10, 15 * 60 )
                          .leadTime( 20, 23 * 60 )
                          .minOrder( 5000 )
          });

          assert.deepEqual( result.why(), ['MinimumOrder'] );

          result.items.push({
            price: 5000
          , quantity: 1
          });

          assert( result.isFulfillable() );
        }}

      , '.isFulfillable() should omit': function( timezone ){ return function(){
          // Order in -24 hours
          var date = moment.tz('America/Chicago').add(2, 'days');

          var result = fulfillability({
            timezone: 'America/Chicago'
          , date: date.format('YYYY-MM-DD')
          , time: date.format('HH:mm a')
          , guests: 20
          , items: []
          , restaurant: restaurants()
                          .openTwentyFourHour()
                          .supports('delivery', 'courier')
                          .leadTime( 10, 15 * 60 )
                          .leadTime( 20, 23 * 60 )
                          .minOrder( 5000 )
          });

          assert.deepEqual( result.why(), ['MinimumOrder'] );
          assert.deepEqual(
            result.why({ omit: [ fulfillability.requirements.MinimumOrder ] })
          , []
          );

          result.items.push({
            price: 5000
          , quantity: 1
          });

          assert( result.isFulfillable() );
        }}
      }
    };

    tztests.timezones.forEach( function( timezone ){
      Object.keys( tztests.tests ).forEach( function( key ){
        it( key + ' ' + timezone, tztests.tests[ key ]( timezone ) );
      });
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
      assert.throws( function(){
        var amenity = orders.amenity({
          guests: 12, price: 100, scale: 'derp', enabled: true
        });

        amenity.getTotal();
      });
    });

    it('.getPriorityAccountCost()', function(){
      var amenity = orders.amenity({
        guests: 12
      , price: 100
      , scale: 'multiply'
      , enabled: true
      , priority_account_price_hike_percentage: 0.27
      });

      assert.equal( amenity.getPriorityAccountCost(), 325 );
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

    it('.getBaseCost()', function(){
      var item = orders.item({
        price: 100
      });

      assert.equal( item.getBaseCost(), 100 );
    });

    it('.getOptionsCost()', function(){
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

      assert.equal( item.getOptionsCost(), 150 );
    });

    it('.getPriorityAccountCost()', function(){
      var item = orders.item({
        price: 200
      , priority_account_price_hike_percentage: 0.1
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
        ]
      });

      assert.equal( item.getPriorityAccountCost(), 35 );
    });

    it('.getTotal() with Priority Account Price Hike', function(){
      var item = orders.item({
        price: 200
      , priority_account_price_hike_percentage: 0.1
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
        ]
      });

      assert.equal( item.getTotal(), 770 );
    });

    it('.getPriorityAccountCost() round to nearest nickel', function(){
      var item = orders.item({
        price: 222
      , priority_account_price_hike_percentage: 0.1
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
        ]
      });

      assert.equal( item.getPriorityAccountCost(), 35 );

      item = orders.item({
        price: 232
      , priority_account_price_hike_percentage: 0.1
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
        ]
      });

      assert.equal( item.getPriorityAccountCost(), 40 );
    });
  });

  describe('Charges', function(){
    var DefaultOrderCharge = stampit()
      .compose( OrderCharge )
      .state({
        type: 'delivery'
      , region: { sales_tax: 0.0825 }
      , restaurant: {
          region: { sales_tax: 0.0825 }
        , plan: { type: 'flat', data: { fee: 0.1 } }
        , is_direct_deposit: true
        , no_contract_fee: 0.047
        }
      , items: [
          { price: 100, quantity: 1 }
        , { price: 200, quantity: 1 }
        ]
      , user: { is_tax_exempt: false }
      , adjustment_amount: -100
      , user_adjustment_amount: -50
      , tip: 50
      , delivery_fee: 100
      , payment_method_id: 123
      });

    it('.getRestaurantCut()', function(){
      var oc = DefaultOrderCharge();
      assert.equal( oc.getRestaurantCut(), 313 );
    });

    it('.getRestaurantCut() - courier', function(){
      var oc = DefaultOrderCharge({ type: 'courier' });
      assert.equal( oc.getRestaurantCut(), 178 );
    });

    it('.getApplicationCut() - delivery', function(){
      var oc = DefaultOrderCharge();
      assert.equal( oc.getApplicationCut(), 58 );
    });

    it('.getApplicationCut() - courier', function(){
      var oc = DefaultOrderCharge({ type: 'courier' });
      assert.equal( oc.getApplicationCut(), 193 );
    });

    it('.getApplicationCut() - with tax exempt user', function(){
      var oc = DefaultOrderCharge({ user: { is_tax_exempt: true } });
      assert.equal( oc.getApplicationCut(), 35 );
    });

    it('.getApplicationCut() - with service fee', function(){
      var oc = DefaultOrderCharge({ service_fee: 100 });
      assert.equal( oc.getApplicationCut(), 167 );
    });

    it('.getRestaurantCut() - with service fee', function(){
      var oc = DefaultOrderCharge({ service_fee: 100 });
      assert.equal( oc.getRestaurantCut(), 312 );
    });

    it('.getApplicationCut() - for Priority account', function(){
      var oc = DefaultOrderCharge();
      oc.priority_account_price_hike_percentage = 0.1;
      oc.adjustment_amount = 0;
      oc.user_adjustment_amount = 0;
      assert.equal( oc.getApplicationCut(), 113 );
    });

    it('.getRestaurantCut() - for Priority account', function(){
      var oc = DefaultOrderCharge();
      oc.priority_account_price_hike_percentage = 0.1;
      oc.adjustment_amount = 0;
      oc.user_adjustment_amount = 0;
      assert.equal( oc.getRestaurantCut(), 402 );
    });

    it('.getTotal()', function(){
      var oc = DefaultOrderCharge();
      assert.equal( oc.getTotal(), 321 );
    });

    it('.getNoContractFee() - non-contracted', function() {
      var oc = DefaultOrderCharge();
      delete oc.restaurant.plan;
      assert.equal( oc.getNoContractFee(), 15 );
    });

    it('.getNoContractFee() - has contract', function() {
      var oc = DefaultOrderCharge();
      assert.equal( oc.getNoContractFee(), 0);
    });
  });

  describe('Payment Summary Items', function(){
    var DefaultPMSItem = stampit()
      .compose( PMSItem )
      .state({
        type: 'delivery'
      , region: { sales_tax: 0.0825 }
      , restaurant: {
          region: { sales_tax: 0.0825 }
        , plan: { type: 'flat', data: { fee: 0.1 } }
        , is_direct_deposit: true
        , no_contract_fee: 0
        }
      , items: [
          { price: 100, quantity: 1 }
        , { price: 200, quantity: 1 }
        ]
      , user: { is_tax_exempt: false }
      , tip: 50
      , delivery_fee: 100
      , payment_method_id: 123
      });

    it('.toPaymentSummaryItem()', function(){
      var item = DefaultPMSItem({

      });

      assert.deepEqual( item.toPaymentSummaryItem(), {
        total: 483
      , delivery_fee: 0
      , tip: 0
      , user_adjustment: 0
      , gb_fee: -48
      , sales_tax: -33
      , order: item
      , net_payout: 402
      });
    });

    it('.toPaymentSummaryItem() courier', function(){
      var item = DefaultPMSItem({
        type: 'courier'
      });

      assert.deepEqual( item.toPaymentSummaryItem(), {
        total: 483
      , delivery_fee: -100
      , tip: -50
      , user_adjustment: 0
      , gb_fee: -33
      , sales_tax: -33
      , order: item
      , net_payout: 267
      });
    });

    it('.toPaymentSummaryItem() tax exempt', function(){
      var item = DefaultPMSItem({
        user: { is_tax_exempt: true }
      });

      assert.deepEqual( item.toPaymentSummaryItem(), {
        total: 450
      , delivery_fee: 0
      , tip: 0
      , user_adjustment: 0
      , gb_fee: -45
      , sales_tax: 0
      , order: item
      , net_payout: 405
      });
    });

    it('.toPaymentSummaryItem() with adjustment', function(){
      var item = DefaultPMSItem({
        adjustment_amount: -100
      });

      assert.deepEqual( item.toPaymentSummaryItem(), {
        total: 375
      , delivery_fee: 0
      , tip: 0
      , user_adjustment: 0
      , gb_fee: -38
      , sales_tax: -25
      , order: item
      , net_payout: 312
      });
    });

    it('.toPaymentSummaryItem() with user adjustment', function(){
      var item = DefaultPMSItem({
        user_adjustment_amount: -100
      });

      assert.deepEqual( item.toPaymentSummaryItem(), {
        total: 375
      , delivery_fee: 0
      , tip: 0
      , user_adjustment: 100
      , gb_fee: -48
      , sales_tax: -25
      , order: item
      , net_payout: 402
      });
    });

    it('.toPaymentSummaryItem() with priority account', function(){
      var item = DefaultPMSItem({
        user: { is_tax_exempt: false }
      , priority_account_price_hike_percentage: 0.1
      });

      assert.deepEqual( item.toPaymentSummaryItem(),{
        total: 483
      , delivery_fee: 0
      , tip: 0
      , user_adjustment: 0
      , gb_fee: -48
      , sales_tax: -33
      , order: item
      , net_payout: 402
      });

      var origNetPayout = item.toPaymentSummaryItem().net_payout;
      item.priority_account_price_hike_percentage = 0.1;

      assert.equal( item.getRestaurantCut(), origNetPayout );
    });
  });

  describe('OrderRewards', function(){
    var TSFORMAT = 'YYYY-MM-DD HH:mm:ss';

    var DefaultOrderRewards = stampit()
      .compose( OrderRewards )
      .state({
        restaurant: {
          region: { sales_tax: 0.0825 }
        , no_contract_fee: 0
        }
      , tip: 0
      });

    it('.isEligibleForHolidayPromo()', function(){
      var order = DefaultOrderRewards({
        submitted: moment().format( TSFORMAT )

      , holidays: [
          { start: moment().add( -1, 'hours' ).format( TSFORMAT )
          , end: moment().add( 1, 'hours' ).format( TSFORMAT )
          , rate: '2.0'
          , description: 'Some Holiday'
          }
        ]
      });

      assert( order.isEligibleForHolidayPromo() );

      order.submitted = moment.tz('America/Chicago').add( -2, 'hours' ).format( TSFORMAT );

      assert( !order.isEligibleForHolidayPromo() );
    });

    it('.isEligibleForMondayPromo()', function(){
      var order = DefaultOrderRewards({
        submitted: moment().day('Monday').format( TSFORMAT )
      });

      assert( order.isEligibleForMondayPromo() );

      order.submitted = moment.tz('America/Chicago').day('Tuesday').format( TSFORMAT );

      assert( !order.isEligibleForMondayPromo() );
    });

    it('.getPoints()', function(){
      var order = DefaultOrderRewards({
        submitted: moment().day('Tuesday').format( TSFORMAT )
      , holidays: []
      , items: [{ price: 1000, quantity: 1 }]
      });

      assert.equal( order.getPoints(), 10 );
    });

    it('.getPoints() - monday', function(){
      var order = DefaultOrderRewards({
        submitted: moment().day('Monday').format( TSFORMAT )
      , holidays: []
      , items: [{ price: 1000, quantity: 1 }]
      });
      assert.equal( order.getPoints(), 20 );
    });

    it('.getPoints() - holiday', function(){
      var order = DefaultOrderRewards({
        submitted: moment().format( TSFORMAT )

      , holidays: [
          { start: moment().add( -1, 'hours' ).format( TSFORMAT )
          , end: moment().add( 1, 'hours' ).format( TSFORMAT )
          , rate: '2.0'
          , description: 'Some Holiday'
          }
        ]

      , items: [{ price: 1000, quantity: 1 }]
      });

      assert.equal( order.getPoints(), 20 );
    });

    it('.getPoints() - priority account', function(){
      var order = DefaultOrderRewards({
        submitted: moment().day('Tuesday').format( TSFORMAT )
      , holidays: []
      , items: [{ price: 1000, quantity: 1 }]
      , priority_account_price_hike_percentage: 0.1
      });

      assert.equal( order.getPoints(), 22 );
    });

    it('.getPoints() - monday and priority account', function(){
      var order = DefaultOrderRewards({
        submitted: moment().day('Monday').format( TSFORMAT )
      , holidays: []
      , items: [{ price: 1000, quantity: 1 }]
      , priority_account_price_hike_percentage: 0.1
      });

      assert.equal( order.getPoints(), 44 );
    });
  });

  describe('OrderTransfer', function(){
    var Transfer = require('stamps/orders/transfer');
    var defaultOrder = {
      type: 'delivery'
    , id: 1
    , uuid: 'foo'
    , region: { sales_tax: 0.0825 }
    , restaurant: {
        id: 2
      , region: { sales_tax: 0.0825 }
      , stripe_id: 'bar'
      , plan: { type: 'flat', data: { fee: 0.1 } }
      , is_direct_deposit: true
      , no_contract_fee: 0
      }
    , items: [
        { price: 100, quantity: 1 }
      ]
    , user: { is_tax_exempt: false, id: 3 }
    , adjustment_amount: 0
    , user_adjustment_amount: 0
    , tip: 0
    , delivery_fee: 0
    , payment_method_id: 123
    };

    it('.getTransferData()', function(){
      var transfer = Transfer.create({ order: defaultOrder });

      assert.deepEqual( transfer.getTransferData(), {
        amount: 89
      , currency: 'usd'
      , destination: 'bar'
      , description: 'Order #1'
      , statement_descriptor: 'GOODYBAG CATER #1'
      , metadata: {
          user_id: 3
        , restaurant_id: 2
        , order_id: 1
        , order_uuid: 'foo'
        }
      });
    });

    it('.getErrorInsertData()', function(){
      var transfer = Transfer.create({ order: defaultOrder });

      assert.deepEqual( transfer.getErrorInsertData({ foo: 'bar' }), {
        order_id: 1
      , restaurant_id: 2
      , error: { foo: 'bar' }
      });
    });

    it('.getInsertData()', function(){
      var transfer = Transfer.create({ order: defaultOrder });
      transfer.transfer = { id: 'foo' };

      assert.deepEqual( transfer.getInsertData(), {
        order_id: 1
      , restaurant_id: 2
      , stripe_transfer_id: 'foo'
      });
    });
  });
});
