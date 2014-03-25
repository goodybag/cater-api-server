var express = require('express');

/**
 * Wrap express.cookieSession, set expires if user checks 'remember me'
 */

module.exports = function(req, res, next) {
  var options = null;

  // console.log('checking req.session.remember', req.signedCookies);
  // if(req.signedCookies.remember) {
  //   options = { maxAge: 30000 };
  //   console.log('maxagedddd');
  // }

  var cookieSession = express.cookieSession(options);
  cookieSession(req, res, next);
};