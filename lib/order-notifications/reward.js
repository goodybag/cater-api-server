/**
 * Reward Notifications
 */

var moment    = require('moment');
var notifier  = require('../order-notifier');
var scheduler = require('../scheduler');
var config    = require('../../config');
var app       = require('../../app');
var db        = require('../../db');
var utils     = require('../../utils');
var helpers   = require('../../public/js/lib/hb-helpers');

notifier.register({
  type: 'reward'
, id: 'user-reward-confirmation'
, name: 'User Reward Confirmation'
, description: [
    'Sends confirmation email to user about a redeemed reward'
  ].join('')
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: 'email-layout'
    , config: config
    , order:  order
    };

    var email = {
      to:         order.user.email
    , from:       config.emails.info
    , subject:    '[Rewards] Reward Confirmation'
    };

    logger.info( 'Setting up email', email );

    if ( options.render === false ){
      return callback( null, email );
    }

    // TODO set up redemption template
    email.html =  [ 'Placeholder'
                  ].join('\n');

    callback( null, email );
  }
});

notifier.register({
  type: 'reward'
, id: 'gb-reward-confirmation'
, name: 'GB Reward Confirmation'
, description: [
    'Sends confirmation email to goodybag about a redeemed reward'
  ].join('')
, build: function( order, logger, options, callback ){
    var viewOptions = {
      layout: 'email-layout'
    , config: config
    , order:  order
    };

    var email = {
      to:         config.emails.rewards
    , from:       config.emails.info
    , subject:    ['[Rewards] User #', order.user.id, ' just redeemed!' ].join('')
    };

    logger.info( 'Setting up email', email );

    if ( options.render === false ){
      return callback( null, email );
    }

    // TODO
    email.html =  [ 'Placeholder'
                  ].join('\n');

    callback( null, email );
  }
});
