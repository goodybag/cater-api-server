if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var stampit = require('stampit');
  var moment  = require('moment-timezone')
  return stampit().state({
    timezone: null
  , businessHours: { start: 6, end: 22 }
  }).enclose(function() {
    this.datetime = this.datetime || new Date(); // need to dynamically create
  }).methods({
    toISOString: function() {
      return moment.tz(this.datetime, this.timezone).toISOString();
    }
  });
});
