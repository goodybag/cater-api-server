/**
 * Orders.Base
 */

if ( typeof module === "object" && module && typeof module.exports === "object" ){
  var isNode = true, define = function (factory) {
    module.exports = factory(require, exports, module);
  };
}

define( function( require, exports, module ){
  var utils = require('utils');
  var config = require('config');
  var moment = require('moment-timezone');

  var REWARDS_RATE = 0.01;
  var PRIORITY_RATE = 2;

  return module.exports = require('stampit')()
    .compose( require('./base') )
    .state({
      holidays: config.rewardHolidays
    , mondayPromo: config.rewardsPromo
    })
    .methods({
      isEligibleForHolidayPromo: function(){
        return !!this.getEligibleHoliday();
      }

    , isEligibleForMondayPromo: function(){
        var submitted = moment( this.submitted );
        return submitted.day() == 1 && submitted >= moment( this.mondayPromo.start );
      }

    , getEligibleHoliday: function(){
        var submitted = moment( this.submitted );

        return utils.find( this.holidays, function( holiday ){
          return submitted >= moment( holiday.start ) && submitted < moment( holiday.end );
        });
      }

    , getPoints: function(){
        var result = this.getTotal();

        result = Math.floor( result * REWARDS_RATE );

        if ( this.isEligibleForHolidayPromo() ){
          result *= this.getEligibleHoliday().rate;
        } else if ( this.isEligibleForMondayPromo() ){
          result *= this.mondayPromo.rate;
        }

        if ( this.priority_account_price_hike_percentage ){
          result *= PRIORITY_RATE;
        }

        return result;
      }
    });
});