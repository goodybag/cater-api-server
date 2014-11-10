var path      = require('path');
var config    = require('../../../config');
var utils     = require('../../../utils');
var slogger   = require('../logger');
var helpers   = require('../../../public/js/lib/hb-helpers');
var db        = require('../../../db');
var app       = require('../../../app');

var getUser = function( userId ){
  return db.users.findOne.bind(db.users, userId);
};

var notifyGb = function( reward, userId ){
  return function(done, results) {
    var context = {
      layout: 'email-layout'
    , reward: reward
    , userId: userId
    , config: config
    };

    app.render('rewards/notify-gb-confirmation', context, function(err, html) {
      if (err) slogger.error(err);
      utils.sendMail2({
        to:       config.emails.rewards
      , from:     config.emails.info
      , subject:  [ '[Rewards] User #', userId, ' just redeemed!' ].join('')
      , html:     html
      }, done);
    });
  };
};

var notifyUser = function( reward, userId ){
  return function(done, results) {
    var user = results.getUser;

    utils.sendMail2({
      to: user.email
    , from: config.emails.info
    , subject: [ '[Rewards] Redemption Confirmation' ].join('')
    , html: [
        '<p>Thank you for ordering with Goodybag! This email is to confirm that you have redeemed a giftcard.</p>'
      , '<br>'
      , '<strong>Details:</strong><br>'
      , '<ul>'
      , '  <li>Type: ', reward.location, '</li>'
      , '  <li>Amount: $', helpers.dollars( reward.amount ), '</li>'
      , '  <li>Points Used: ', reward.cost, '</li>'
      , '</ul>'
      , '<p>Your giftcard is on its way! Note that delivery may take up to two weeks. Please contact us if you have further inquiries.</p>'
      , '<p>Goodybag</p>'
      ].join('')
    }, done);
  };
};

module.exports = function( job, done ){
  var logger = slogger.create('Redeem Reward', {
    data: job
  });

  logger.info('Sending redemption email');

  var reward = job.data.reward;
  var userId = job.data.userId;
  var redemption = utils.extend({user_id: userId}, reward);

  utils.async.auto({
    getUser:    getUser( userId )
  , notifyGb:   [ 'getUser', notifyGb(reward, userId) ]
  , notifyUser: [ 'getUser', notifyUser(reward, userId) ]
  }, function (err, results) {
    if ( err )
      logger.error('Unable to notify reward redemption', err);
    db.users_redemptions.insert(redemption, done);
  });
};
