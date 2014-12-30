/**
 * Events:Rewards
 */

var moment    = require('moment-timezone');
var utils     = require('../../utils');
var config    = require('../../config');
var scheduler = require('../scheduler');

module.exports = {
  'reward:redeemed':
  function( reward, userId ){
    this.logger.info( 'Redemption', reward, userId );
    var now = ( new moment() ).tz('UTC').toDate();
    scheduler.enqueue( 'redeem-reward', now, {
      reward: reward
    , userId: userId
    });
  }
};