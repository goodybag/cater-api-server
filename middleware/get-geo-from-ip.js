/**
 * Get GEO Info from IP Address
 */

var utils   = require('../utils');
var config  = require('../config');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    url: config.geoipUrl
  });

  return function( req, res, next ){
    var ip = config.isDev ?
      config.geoTestIp : req.header('x-forwarded-for') || req.connection.remoteAddress

    utils.get( options.url.replace( ':ip', ip ), { timeout: 2000 }, function( error, gres, geo ){
      // Error getting geocode is not a shower-stopper
      if ( error ){
        req.logger.error( 'Could not get geo code info', { ip: ip, error: error } );
        return next();
      }

      req.geo = geo;

      next();
    });
  };
};