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
        var submitted = moment( order.submitted );
        return submitted.day() == 1 && submitted >= moment( config.rewardsPromo.start );
      }

    , getEligibleHoliday: function(){
        var submitted = moment( order.submitted );

        return utils.find(config.rewardHolidays, function(holiday) {
          return submitted >= moment( holiday.start ) && submitted < moment( holiday.end );
        });
      }

    , getPoints: function(){
        var result = this.getTotal();

        if ( this.isEligibleForHolidayPromo ){
          result *= this.getEligibleHoliday().rate;
        } else if ( this.isEligibleForMondayPromo ){
          result *= config.rewardsPromo.rate;
        }

        return Math.floor( result * REWARDS_RATE );
      }
    });
});