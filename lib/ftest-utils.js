/**
 * Needs to be phantomjs compatible
 */

var config = require('../functional-config');
var _      = require('underscore');

_.extend( module.exports, _ );

module.exports.login = function( test, options ){
  options = _.defaults( options || {}, {
    formSelector: 'form[action*="/login"]'
  , autoSubmit:   true
  });

  if ( !options.email ){
    throw new Error('Missing required option `email`');
  }

  if ( !options.password ){
    throw new Error('Missing required option `password`');
  }

  return function(){
    var login = {
      email:    options.email
    , password: options.password
    };

    this.fill( options.formSelector, login, options.autoSubmit );
  };
};

module.exports.getEmail = function( userId ){
  return config.testEmail.split('@').join(
    [ '+', userId, config.emailSalt || '', '@' ].join('')
  );
};