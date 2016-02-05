var forky   = require('forky');
var cluster = require('cluster');
var _       = require('lodash');
var errors  = require('../errors');

module.exports = function( options ){
  options = _.defaults( options || {}, {
    timeout: 10000
    // Give everything 2 seconds before pulling the plug
  , disconnectTimeout: 2000
  });

  return function( req, res, next ){
    if ( res.timeoutSet ){
      res.setTimeout( options.timeout );
      return next();
    }

    res.setTimeout( options.timeout, function(){
      if ( res.headersSent ){
        res.end();
        return forky.disconnect( options.disconnectTimeout );
      }

      // Headers have not been sent, so we can safely render an error page
      req.on( 'end', function(){
        return forky.disconnect( options.disconnectTimeout );
      });

      return next( errors.internal.TIMEOUT );
    });

    res.timeoutSet = true;

    next();
  }
};