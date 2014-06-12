var assert    = require('assert');
var moment    = require('moment-timezone');
var utils     = require('../../utils');
var criteria  = require('../../public/js/lib/order-delivery-service-criteria');

function testCriteria( order ){
  return criteria.some( function( fn ){
    return fn( order );
  });
}

describe ('Order Delivery Service Criteria', function(){
  var defaultOrder = {
    sub_total:  1000
  , guests:     25
  , zip:        '78756'
  , datetime:   moment().tz('America/Chicago').format('YYYY-MM-DD 12:00:00')
  , restaurant: {
      delivery_service_order_amount_threshold:  500
    , head_count_delivery_service_threshold:    20
    , delivery_zips: ['78756']
    , delivery_zip_groups: [
        { fee: 1000, zips: ['78756'] }
      , { fee: 1200, zips: ['78755'] }
      ]
    , lead_times: [
        { lead_time: 100, max_guests: 10 }
        { lead_time: 200, max_guests: 20 }
      ]
    , pickup_times: [
        { lead_time: 100, max_guests: 100 }
        { lead_time: 200, max_guests: 200 }
      ]
    , region: {
        timezone: 'America/Chicago'
      , lead_time_modifier: 40
      }
    }
  };

  it ('should not be delivery service', function(){
    var order = defaultOrder;

    var result = criteria.some( function( fn ){
      return fn( order );
    });

    assert( !result );
  });

  it ('should be delivery service because dollar amount', function(){
    var order = utils.deepExtend( {}, defaultOrder, {
      sub_total: 500
    , restaurant: {
        delivery_service_order_amount_threshold:  1000
      }
    };

    assert( testCriteria( order ) );
  });

  it ('should be delivery service because head count', function(){
    var order = {
      guests: 20
    , restaurant: {
        head_count_delivery_service_threshold:    25
      }
    };

    assert( testCriteria( order ) );
  });

  it ('should be delivery service because delivery zip', function(){
    var order = utils.deepExtend( {}, defaultOrder, {
      zip: '78755'
    , restaurant: {
        delivery_zips: ['78756']
      }
    });

    assert( testCriteria( order ) );
  });

  it ('should be delivery service because delivery time', function(){
    var order = utils.deepExtend( {}, defaultOrder, {

    });

    assert( testCriteria( order ) );
  });
});