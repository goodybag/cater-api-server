if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var stampit = require('stampit');
  var moment  = require('moment-timezone');

  return stampit().state({
    timezone: null
  , format: 'YYYY-MM-DD hh:mm:ss'
  }).enclose(function() {
    this.datetime = this.datetime || new Date(); // need to dynamically create
    if ( this.datetime instanceof Date ){
      this._moment = moment.tz(this.datetime, this.timezone);
    } else {
      this._moment = moment.tz(this.datetime, this.format, this.timezone);
    }
  }).methods({
    tz: function(timezone) {
      if ( timezone ) this._moment.tz(timezone);
      return this;
    }
  , toISOString: function() {
      return this._moment.toISOString();
    }
  });
});
