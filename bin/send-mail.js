#!/usr/bin/env node

var utils     = require('../utils');
var config    = require('../config');
var views     = require('../app');
var Models    = require('../models');
var reporter  = require('../lib/stats-reporter');

var options = {
  view: {
    layout:     'emails/layout-gb-update'
  , template:   'emails/updates-and-features'
  }

, recipients:   []
, subject:      'Goodybag This Week: New Restaurants & Features'
, from:         config.emails.info
, concurrency:  5
};

var stats = reporter.createStatsGroup({
  messagesSent: 'Messages Sent'
, errors:       'Errors'
});

Models.User.find( { limit: 0 }, function( error, users ){
  if ( error ) throw error;

  options.recipients = users.map( function( u ){
    return u.attributes.email;
  });

  var fns = options.recipients.map( function( to ){
    return function( done ){
      views.render( options.view.template, options.view, function( error, html ){
        utils.sendMail2({
          to:       to
        , from:     options.from
        , subject:  options.subject
        , html:     html
        , headers: {
            'X-Mailgun-Campaign-Id': 'c1h5p'
          }
        }, function( error ){

          if ( error ){
            process.stdout.write('x');
            stats.errors.value++;
          } else {
            process.stdout.write('.');
            stats.messagesSent.value++;
          }

          return done( error );
        });
      });
    }
  });

  utils.async.parallelNoBail( fns, options.concurrency, function( errors ){
    reporter.logResults( errors, {
      'Email Blast Results': stats
    });

    process.exit( ~~(errors && errors.length > 0) );
  });
});
