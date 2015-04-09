/**
 * Billing Period
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var moment = require('moment');

  return module.exports = require('stampit')()
    .state({

    })
    .enclose( function(){
      this.startDate = this.startDate || moment().format( this.format );
      this.endDate = this.endDate || moment().format( this.format );
    })
    .methods({
      format: 'YYYY-MM-DD'

    , start: function( startDate ){
        if ( !startDate ) return this.startDate;
        this.startDate = startDate;
        return this;
      }

    , end: function( endDate ){
        if ( !endDate ) return this.endDate;
        this.endDate = endDate;
        return this;
      }

    , getMosqlRangeQuery: function(){
        return {
          $gt: this.startDate
        , $lt: moment( this.endDate ).add( 'days', 1 ).format( this.format )
        };
      }
    });
});