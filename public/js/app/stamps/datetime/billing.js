if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var moment = require('moment-timezone');
  var stampit = require('stampit');
  var billingP = require('./billing-period');

  return stampit()
    .methods({
      getBillingPeriod: function(){
        var start, end;

        // Zero out values less granular than `month`
        var d     = this._moment.format('YYYY-MM-DD');
        var start = moment( d ).startOf('month');
        var end   = moment( d ).startOf('month');
        if ( this._moment.date() < 15 ){
          start.set( 'date', 1 );
          end.set( 'date', 15 );
        } else {
          start.set( 'date', 16 );
          end.endOf('month');
        }

        return billingP({
          startDate:  start.format('YYYY-MM-DD')
        , endDate:    end.format('YYYY-MM-DD')
        });
      }

    , getPreviousBillingPeriod: function(){
        var start, end;

        // Zero out values less granular than `month`
        var d     = this._moment.toString();
        var start = moment( d ).startOf('month');
        var end   = moment( d ).startOf('month');

        if ( this._moment.date() < 15 ){
          start.subtract( 1, 'month' ).set( 'date', 16 );
          end.subtract( 1, 'month' ).endOf('month');
        } else {
          start.set( 'date', 1 );
          end.set( 'date', 15 );
        }

        return billingP({
          startDate:  start.format('YYYY-MM-DD')
        , endDate:    end.format('YYYY-MM-DD')
        });
      }

    , isStartOfBillingPeriod: function(){
        return [ 1, 16 ].indexOf( this._moment.date() ) > -1;
      }
    });
});