/**
 * Disabled times
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var moment = require('moment');
  var _ = require('lodash');

  module.exports = require('stampit')()
    .state({

    })
    .enclose( function(){
    })
    .methods({
      getDisabledTimes: function(){
        var disabledTimes = [];
        var restaurant = this.restaurant;
        _.each( _.range(7), function( i ){
          if ( restaurant.get('delivery_times')[ i ].length === 0 )
          if ( restaurant.get('hours_of_operation')[ i ].length === 0 ){
            disabledTimes.push( i + 1 );
          }
        });

        // Disable dates for closed restaurant events
        var closedEvents = restaurant.get('event_date_ranges');
        if ( closedEvents && closedEvents.length ) {
          // For each range, push each date
          closedEvents.forEach(function(val) {
            var range = val.replace(/[\[\]\(\)]/g, '').split(',');
            var start = moment(range[0]);
            var end = moment(range[1]);

            while(!start.isSame(end)) {
              disabledTimes.push([start.year(), start.month(), start.date()]);
              start = start.add('days', 1);
            }
          });
        }

        return disabledTimes;
      }
    });

  return module.exports;
});
