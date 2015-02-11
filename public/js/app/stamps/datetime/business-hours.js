if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}
// Ensure all methods wrap datetime in moment for convenience?
define( function( require, exports, module ){
  var utils   = require('utils');
  var moment  = require('moment-timezone');
  var stampit = require('stampit');
  return stampit()
    .methods({
      getWorkingTime: function(){
        var datetime = moment.tz(this.datetime, this.timezone);
        var hr = datetime.hour();

        if (hr < this.businessHours.start){
          datetime
            .hour(this.businessHours.start)
            .startOf('hour');
        }

        if ( hr >= this.businessHours.end ){
          datetime
            .add(1, 'days')
            .hour(this.businessHours.start)
            .startOf('hour');
        }

        return datetime;
      }

    , isWeekend: function() {
        datetime = moment.tz(this.datetime, this.timezone);
        return datetime.day() === 0 || datetime.day() === 6;
      }

    , isWeekday: function() {
        return !this.isWeekend();
      }

    , isAfterHours: function() {
        var datetime = moment.tz(this.datetime, this.timezone);
        return datetime.hour() <  this.businessHours.start ||
               datetime.hour() >= this.businessHours.end;
      }

    , duringBusinessHours: function() {
        return !this.isAfterHours();
      }

    , isWithin: function( ) {
        var args = Array.prototype.slice.call(arguments);
        var dt = moment.tz(this.datetime, this.timezone);
        var timeFromNow = moment();
        timeFromNow = timeFromNow.add.apply(timeFromNow, args);
        return dt < timeFromNow;
      }
    });
});
