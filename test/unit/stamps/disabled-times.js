var assert      = require('assert');
var utils       = require('utils');
var config      = require('../../../config');
var errors      = require('../../../errors');
var db          = require('../../../db');
var DTStamp     = require('stamps/disabled-times');
var Restaurant  = require('../../../public/js/app/models/restaurant');

describe('Disabled days for datepicker', function(){
  it('should disable all days of the week', function() {
    // Basically this is a restaurant that is never open
    // so it should be disabled every day.
    var restaurant = new Restaurant({
      delivery_times: {
        0: [],
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: []
      },
      hours_of_operation: {
        0: [],
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: []
      }
    });
    var disabledTimes = DTStamp.create({ restaurant: restaurant }).getDisabledTimes();
    assert(Array.isArray(disabledTimes));
    assert.deepEqual(disabledTimes, utils.range(1, 8));
  });

  it('should disable some days because of delivery times', function() {
    // For mocking a restaurant with delivery times, the actual
    // representation of each time slot is irrelevant.
    // We just need each day to have some length.
    var restaurant = new Restaurant({
      delivery_times: {
        0: [],
        1: [true],
        2: [],
        3: [],
        4: [true],
        5: [],
        6: []
      },
      hours_of_operation: {
        0: [],
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: []
      }
    });
    var disabledTimes = DTStamp.create({ restaurant: restaurant }).getDisabledTimes();
    assert(Array.isArray(disabledTimes));
    assert.deepEqual(disabledTimes, [1,3,4,6,7]);
  });

  it('should disable some days because of hours of operation', function() {
    // For mocking a restaurant with delivery times, the actual
    // representation of each time slot is irrelevant.
    // We just need each day to have some length.
    var restaurant = new Restaurant({
      delivery_times: {
        0: [],
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: []
      },
      hours_of_operation: {
        0: [true],
        1: [],
        2: [],
        3: [true],
        4: [true],
        5: [],
        6: []
      }
    });
    var disabledTimes = DTStamp.create({ restaurant: restaurant }).getDisabledTimes();
    assert(Array.isArray(disabledTimes));
    assert.deepEqual(disabledTimes, [2,3,6,7]);
  });

  it('should disable some days because of delivery times and hours of operation', function() {
    var restaurant = new Restaurant({
      delivery_times: {
        0: [true],
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: [true]
      },
      hours_of_operation: {
        0: [true],
        1: [],
        2: [],
        3: [true],
        4: [true],
        5: [],
        6: []
      }
    });
    var disabledTimes = DTStamp.create({ restaurant: restaurant }).getDisabledTimes();
    assert(Array.isArray(disabledTimes));
    assert.deepEqual(disabledTimes, [2,3,6]);
  });
});
