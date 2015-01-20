/**
 * Restaurant Gleaning
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var moment  = require('moment');
  var stampit = require('stampit');

  return stampit({
    mealTypeMap: {
      'Appetizers': {}
    , 'Breakfast':  { after: 4,  before: 10 }
    , 'Lunch':      { after: 11, before: 15 }
    , 'Dinner':     { after: 15, before: 23 }
    }

  , getMealTypesFromHours: function(){
      var times = this.delivery_times.map( function( time ){
        var start = time.start_time;
        start = moment( start, 'hh:mm:ss' );
        start = start.get('hour') + ( start.get('minute') / 60 );

        var end = time.end_time;
        end = moment( end, 'hh:mm:ss' );
        end = end.get('hour') + ( end.get('minute') / 60 );

        return { start: start, end: end };
      });

      var types = Object
        .keys( this.mealTypeMap )
        .filter( function( type ){
          var constraints = this.mealTypeMap[ type ];

          if ( !constraints.before && !constraints.after ) return true;

          for ( var i = 0, time; i < times.length; i++ ){
            time = times[ i ];

            if ( time.start < constraints.before ){
              if ( !constraints.after ) return true;

              return constraints.after < time;
            }
          }

          return false;
        }.bind( this ));

      return types;
    }
  }, {
    delivery_times: []
  });
});