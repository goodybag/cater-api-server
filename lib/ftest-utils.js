/**
 * Needs to be phantomjs compatible
 */

var config = require('../functional-config');
var _      = require('underscore');

_.extend( module.exports, _ );

/**
 * Finds options.formSelector, fills in form with options.email|password
 * and optionally automatically submits for (this is default)
 *
 * Usage:
 *
 *   casper.then(
 *     futils.login( test, {
 *       email:      'my@email.com'
 *     , password:   'password'
 *     })
 *   );
 *
 * @param  {Object} test    Casperjs test object
 * @param  {Object} options Options
 * @return {Function}       Function to be called in casper.then()
 */
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

/**
 * Given a userId, returns a parsed email based on local-config
 * @param  {Number} userId User ID of the email you want
 * @return {String}        The parsed email address
 */
module.exports.getEmail = function( userId ){
  return config.testEmail.split('@').join(
    [ '+', userId, config.emailSalt || '', '@' ].join('')
  );
};