var forky   = require('forky');
var config  = require('../config');

module.exports = function( options ){
  return function( req, res, next ){
    res.setTimeout( config.http.timeout, function(){
      req.logger.error('Timeout');

      res.send(503);
      req.on( 'end', function(){
        forky.disconnect();
        process.exit();
      });
    });

    next();
  }
};