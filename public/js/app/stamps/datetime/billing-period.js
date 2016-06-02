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
          $gte: this.startDate
        , $lt: moment( this.endDate ).add( 'days', 1 ).format( this.format )
        };
      }

    , next: function(){
        var start = moment( this.startDate, this.format );
        var end = moment( this.endDate, this.format );

        if ( start.date() < 15 ){
          start.set('date', 16);
          end.endOf('month');
        } else {
          start.add('month', 1).set('date', 1);
          end.add('month', 1).set('date', 15);
        }

        return module.exports.create({
          startDate: start.format( this.format )
        , endDate: end.format( this.format )
        })
      }

    , previous: function(){
        var start = moment( this.startDate, this.format );
        var end = moment( this.endDate, this.format );

        if ( start.date() < 15 ){
          start.add('month', -1).set('date', 16);
          end.add('month', -1).endOf('month');
        } else {
          start.set('date', 1);
          end.set('date', 15);
        }

        return module.exports.create({
          startDate: start.format( this.format )
        , endDate: end.format( this.format )
        });
      }
    });
});
