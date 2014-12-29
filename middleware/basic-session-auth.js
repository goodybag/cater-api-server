/**
 * Extends Basic Auth so this form of authentication
 * will interop with our existing routes since we
 * expect user to be on req.session rather than
 * req.user
 */

var express = require('express');
var auth    = require('../lib/auth');
var Models  = require('../models');

var basic   = require('basic-auth-connect')( auth );

module.exports = function(){
  return function( req, res, next ){
    if ( req.session && req.session.user && req.session.user.id ) return next();

    // Remove the guest user
    var guest = req.user;
    delete req.user;

    // express basic puts user on request,
    // so override next and capture the value on session
    basic( req, res, function(){
      // No user found via basic auth, so reset to guest
      if ( !req.user ){
        req.user = guest
      } else {
        req.session.user = { id: req.user.attributes.id };
        req.user = new Models.User( req.user );
      }

      next();
    });
  };
};