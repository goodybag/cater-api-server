var path      = require('path');
var config    = require('../../../config');
var utils     = require('../../../utils');
var slogger   = require('../logger');
var helpers   = require('../../../public/js/lib/hb-helpers');
var db        = require('../../../db');

module.exports = function( job, done ){
  var logger = slogger.create('Redeem Reward', {
    data: job
  });

  logger.info('Sending redemption email');

  var reward = job.data.reward;
  var userId = job.data.userId;

  utils.sendMail2({
    to: config.emails.rewards
  , from: config.emails.info
  , subject: [ '[Rewards] User #', userId, ' just redeemed!' ].join('')
  , html: [
      '<a href="', config.baseUrl, '/users/', userId, '">User #', userId, '</a>'
    , ' just redeemed a giftcard.'
    , '<br>'
    , '<strong>Details:</strong><br>'
    , '<ul>'
    , '  <li>Location: ', reward.location, '</li>'
    , '  <li>Amount: $', helpers.dollars( reward.amount ), '</li>'
    , '  <li>Points: ', reward.cost, '</li>'
    , '</ul>'
    ].join('')
  }, function( error ){
    if ( error ) {
      logger.error( 'Error sending redemption email', {
        error: error
      });
      console.log(error);
      return done( error );
    }
    var redemption = utils.extend({user_id: userId}, reward);
    db.users_redemptions.insert(redemption, done);
  });
};