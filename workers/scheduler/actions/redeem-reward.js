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

var insertRedemption = function( redemption ){
  return db.users_redemptions.insert.bind(db.users_redemptions, redemption);
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
      if ( err ) {
        console.log(err);
        slogger.error('Could not notify gb', { error: err });
        return done(err);
      }

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
    var context = {
      layout: 'email-layout'
    , reward: reward
    , user:   results.getUser
    , config: config
    };

    app.render('rewards/notify-user-confirmation', context, function(err, html) {
      if ( err ) {
        slogger.error('Could not notify user', err);
        return done(err);
      }

      utils.sendMail2({
        to:     results.getUser.email
      , from:   config.emails.info
      , subject: '[Rewards] Redemption Confirmation'
      , html:   html
      }, done);
    });
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
    getUser:            getUser( userId )
  , insertRedemption:   insertRedemption( redemption )
  , notifyGb:           [ 'getUser', notifyGb(reward, userId) ]
  , notifyUser:         [ 'getUser', notifyUser(reward, userId) ]
  }, function (err, results) {
    if ( err )
      logger.error('Unable to notify reward redemption', err);
    done(err);
  });
};
