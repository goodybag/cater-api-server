var assert    = require('assert');
var moment    = require('moment-timezone');
var utils     = require('../../utils');
var criteria  = require('../../public/js/lib/order-delivery-service-criteria');

describe ('Order Delivery Service Criteria', function(){
  var now = moment().tz('America/Chicago');

  // If it's within an hour or after 12pm, just advance to the next monday
  // just in case
  if ( now.get('hour') >= 11 ){
    now = now.day(8);
  }
  var defaultOrder = {
    sub_total:  1000
  , guests:     25
  , zip:        '78756'
  , datetime:   now.format('YYYY-MM-DD 12:00:00')
  , restaurant: {
      minimum_order: 100
    , delivery_service_order_amount_threshold:  500
    , delivery_service_order_total_upperbound:  200000
    , delivery_service_head_count_threshold:    20
    , delivery_zips: ['78756']
    , delivery_zip_groups: [
        { fee: 1000, zips: ['78756'] }
      , { fee: 1200, zips: ['78755'] }
      ]
    , delivery_times: {
        "0": [],
        "1": [ [ "11:00:00", "15:00:00" ] ],
        "2": [ [ "11:00:00", "15:00:00" ] ],
        "3": [ [ "11:00:00", "15:00:00" ] ],
        "4": [ [ "11:00:00", "15:00:00" ] ],
        "5": [ [ "11:00:00", "15:00:00" ] ],
        "6": []
      }
    , hours_of_operation: {
        "0": [],
        "1": [ [ "10:00:00", "16:00:00" ] ],
        "2": [ [ "10:00:00", "16:00:00" ] ],
        "3": [ [ "10:00:00", "16:00:00" ] ],
        "4": [ [ "10:00:00", "16:00:00" ] ],
        "5": [ [ "10:00:00", "16:00:00" ] ],
        "6": []
      }
    , lead_times: [
        { lead_time: 100, max_guests: 30 }
      , { lead_time: 200, max_guests: 40 }
      ]
    , pickup_lead_times: [
        { lead_time: 100, max_guests: 100 }
      , { lead_time: 200, max_guests: 200 }
      ]
    , region: {
        timezone: 'America/Chicago'
      , lead_time_modifier: 40
      }
    }
  };

  it ('should not be delivery service', function(){
    var order = defaultOrder;

    assert( !criteria.check( order ) );
  });

  it ('should be delivery service because dollar amount', function(){
    var order = utils.deepExtend( {}, defaultOrder, {
      sub_total: 500
    , restaurant: {
        delivery_service_order_amount_threshold:  1000
      }
    });

    assert( criteria.check( order ) );
  });

  it ('should be delivery service because head count', function(){
    var order = utils.deepExtend( {}, defaultOrder, {
      guests: 20
    , restaurant: {
        delivery_service_head_count_threshold:    25
      }
    });

    assert( criteria.check( order ) );
  });

  it ('should be delivery service because delivery zip', function(){
    var order = utils.deepExtend( {}, defaultOrder, {
      zip: '78755'
    , restaurant: {
        delivery_zips: ['78756']
      }
    });

    assert( criteria.check( order ) );
  });

  it ('should be delivery service because delivery time', function(){
    var order = utils.deepExtend( {}, defaultOrder, {
      restaurant: {
        delivery_times: {
          "0": [],
          "1": [ [ "00:00:00", "01:00:00" ] ],
          "2": [ [ "00:00:00", "01:00:00" ] ],
          "3": [ [ "00:00:00", "01:00:00" ] ],
          "4": [ [ "00:00:00", "01:00:00" ] ],
          "5": [ [ "00:00:00", "01:00:00" ] ],
          "6": []
        }
      }
    });

    assert( criteria.check( order ) );
  });

  it ('should be delivery service because lead time', function(){
    var order = utils.deepExtend( {}, defaultOrder, {
      restaurant: {
        // Make lead times trigger pickup
        lead_times: [
          { lead_time: 100, max_guests: 10 }
        , { lead_time: 200, max_guests: 20 }
        ]
      }
    });

    assert( criteria.check( order ) );
  });
});