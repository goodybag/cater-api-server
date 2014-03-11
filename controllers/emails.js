var utils   = require('../utils');
var config  = require('../config');

module.exports.get = function( req, res ){
  var options = {
    layout:       'emails/layout'
  , showControls: true
  };

  res.render( [ 'emails', req.param('name') ].join('/'), options );
};

module.exports.post = function( req, res ){
  var options = {
    layout: 'emails/layout'
  };

  res.render( [ 'emails', req.param('name') ].join('/'), options, function( error, html ){
    utils.sendMail2({
      to: config.testEmail
    , from: config.emails.info
    , subject: 'Test Email: ' + req.param('name')
    , html: html
    });

    options.showControls = true;

    res.render( [ 'emails', req.param('name') ].join('/'), options );
  });
};