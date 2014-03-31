/**
 * Welcome Emailer
 */

var utils   = require('../utils');
var Models  = require('../models');
var config  = require('../config');
var logger  = require('../logger').welcomeEmail;

module.exports.send = utils.overload({
  'User,Function':
  function( user, callback ){
    var options = {
      layout: 'emails/layout'
    , user:   user.toJSON()
    };

    logger.info( 'Preparing welcome email for user', user.toJSON() );

    app.render( 'emails/welcome-jacob', options, function( error, html ){
      if ( error ) return logger.error( 'Error rendering welcome email template', error );

      utils.sendMail2({
        to:       user.attributes.email
      , from:     config.emails.welcome
      , subject: 'Welcome to Goodybag!'
      , html:     html
      }, function( error ){
        if ( error ) return logger.error( 'Error sending welcome email', error ), callback( error );
      });
    });
  }

, 'Number,Function':
  function( userId, callback ){
    Models.User.findOne({ where: { id: userId } }, function( error, user ){
      if ( error ) return callback( error );

      return module.exports.send( user, callback );
    });
  }

, 'default':
  function(){
    throw new Error('Must supply a User/userId and a callback');
  }
});

module.exports.hasWelcomedUser = function( userId, callback ){

};