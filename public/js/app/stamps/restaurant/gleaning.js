/**
 * Restaurant Gleaning
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var utils   = require('utils');
  var moment  = require('moment');
  var stampit = require('stampit');

  var STEP = 0.25;

  return stampit()
    .state({
      delivery_times: []
    })
    .methods({
      mealTypeMap: {
        'Appetizers': []
      , 'Breakfast':  utils.range( 4,  10, STEP )
      , 'Lunch':      utils.range( 11, 15, STEP )
      , 'Dinner':     utils.range( 15, 23, STEP )
      }

      /**
       * Get the meal types based on the delivery_times on this object
       *
       * Uses this.mealTypeMap to see if at least STEP (15 min) is contained
       * in each range. If any part of the delivery time range falls in the
       * meal type map time range, then this object is said to have that
       * meal type
       *
       * delivery times              |+++++++|+++
       * meal type              /////|///////|/
       *                 |--+--+--+-...-+--+--+--|
       *                 0  1  2  3 ... 21 22 23 24
       *
       * @return {Array} Array if meal types
       */
    , getMealTypesFromHours: function(){
        var times = this.delivery_times.map( function( time ){
          var start = time.start_time;
          start = moment( start, 'hh:mm:ss' );
          start = start.get('hour') + ( start.get('minute') / 60 );

          var end = time.end_time;
          end = moment( end, 'hh:mm:ss' );
          end = end.get('hour') + ( end.get('minute') / 60 );

          // Range in 15min increments
          return utils.range( start, end, STEP );
        });

        var types = Object
          .keys( this.mealTypeMap )
          .filter( function( type ){
            var constraints = this.mealTypeMap[ type ];
            var time, intersection;

            for ( var i = 0; i < times.length; i++ ){
              time = times[ i ];

              if ( utils.intersection( time, constraints ).length > 0 ){
                return true;
              }
            }

            return false;
          }.bind( this ));

        return types;
      }
    });
});