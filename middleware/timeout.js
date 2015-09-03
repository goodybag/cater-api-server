var forky = require('forky');
var _     = require('lodash');

module.exports = function( options ){
  options = _.defaults( options || {}, {
    timeout: 10000
  });

  return function( req, res, next ){
    res.setTimeout( options.timeout, function(){
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