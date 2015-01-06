/**
 * Consume New Signup -
 * If we saved `isNewSignup` to the user previously,
 * remove it, and set it to locals
 */

var utils = require('../utils');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    indicator: 'isNewSignup'
  });

  return function( req, res, next ){
    var logger = req.logger.create('Middleware-ConsumeNewSignup');

    if ( !req.session[ options.indicator ] ) return next();

    logger.info('Indicator exists');
    res.locals[ options.indicator ] = true;
    delete req.session[ options.indicator ];

    return next();
  };
}