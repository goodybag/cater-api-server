var assert      = require('assert');
var config      = require('../../../config');

var restaurants = require('stamps/restaurant');

describe('Stamps', function(){
  describe('Restaurant', function(){
    describe('Gleaning', function(){
      it('.getMealTypesFromHours()', function(){
        var r1 = restaurants.gleaning.create({
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

      it('.getMealTypesFromHours()', function(){
        var r1 = restaurants.gleaning.create({
          delivery_times: [
            { day: 0, start_time: '00:00:00', end_time: '23:59:59' }
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
          'Breakfast', 'Lunch', 'Dinner'
        ]);
      });

      it('.getMealTypesFromHours()', function(){
        var r1 = restaurants.gleaning.create({
          delivery_times: [
            { day: 0, start_time: '06:00:00', end_time: '09:00:00' }
          ]
        });

        var types = r1.getMealTypesFromHours();

        assert.deepEqual( types, [
          'Breakfast'
        ]);
      });
    });
  });
});