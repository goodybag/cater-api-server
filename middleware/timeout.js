var forky   = require('forky');
var cluster = require('cluster');
var _       = require('lodash');
var errors  = require('../errors');

module.exports = function( options ){
  options = _.defaults( options || {}, {
    timeout: 10000
  });

  return function( req, res, next ){
    res.setTimeout( options.timeout, function(){
      req.on( 'end', function(){
        forky.disconnect();
      });

      return next( errors.internal.TIMEOUT );
    });

    next();
  }
};