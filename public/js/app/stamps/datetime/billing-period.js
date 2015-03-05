/**
 * Billing Period
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  return module.exports = require('stampit')()
    .state({

    })
    .enclose( function(){
      this.startDate = new Date();
      this.endDate = new Date();
    })
    .methods({
      start: function( startDate ){
        if ( !startDate ) return this.startDate;
        this.startDate = startDate;
        return this;
      }

    , end: function( endDate ){
        if ( !endDate ) return this.endDate;
        this.endDate = endDate;
        return this;
      }
    });
});