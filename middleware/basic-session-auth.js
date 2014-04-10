/**
 * Extends Basic Auth so this form of authentication
 * will interop with our existing routes since we
 * expect user to be on req.session rather than
 * req.user
 */

var express = require('express');
var auth    = require('../lib/auth');
var Models  = require('../models');

var basic   = express.basicAuth( auth );

module.exports = function(){
  return function( req, res, next ){
    if ( req.session && req.session.user ) return next();

    // express basic puts user on request,
    // so override next and capture the value on session
    basic( req, res, function(){
      req.session.user = req.user;
      req.user = new Models.User( req.user );
      next();
    });
  };
};