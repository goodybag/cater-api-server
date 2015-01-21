var assert      = require('assert');
var config      = require('../../config');
var rgleaning   = require('../../public/js/app/prototypes/restaurant/gleaning');

describe('Restaurant Gleaning', function(){
  it('Should glean Meal Types from hours', function(){
    var r1 = rgleaning({
      delivery_times: [
        { day: 0, start_time: '10:30:00', end_time: '22:30:00' }
      , { day: 1, start_time: '10:30:00', end_time: '22:30:00' }
      , { day: 2, start_time: '10:30:00', end_time: '22:30:00' }
      , { day: 3, start_time: '10:30:00', end_time: '22:30:00' }
      , { day: 4, start_time: '10:30:00', end_time: '22:30:00' }
      , { day: 5, start_time: '10:30:00', end_time: '22:30:00' }
      , { day: 6, start_time: '10:30:00', end_time: '22:30:00' }
      ]
    });

    var types = r1.getMealTypesFromHours();

    assert.deepEqual( types, [
      'Lunch', 'Dinner'
    ]);
  });
});