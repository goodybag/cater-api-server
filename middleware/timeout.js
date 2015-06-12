var forky   = require('forky');

module.exports = function( time ){
  return function( req, res, next ){
    res.setTimeout( time || 10000, function(){
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