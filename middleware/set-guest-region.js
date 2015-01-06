/**
 * Sets the region according to orderParams/search
 * for guest accounts
 */

var utils = require('../utils');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    defaultRegion: 1
  });

  return function( req, res, next ){
    var logger = req.logger.create('SetGuestRegion');

    if ( !req.user.isGuest() ){
      return next();
    }

    var zip = req.query.zip;

    if ( !zip ){
      zip = req.session.orderParams ? req.session.orderParams.zip : null;
    }

    if ( !zip ){
      logger.info( 'Setting default region', options.defaultRegion );
      req.user.attributes.region_id = options.defaultRegion;
      return next();
    }
    
    var region = utils.find( req.regions, function( region ){
      return region.zips.indexOf( zip ) > -1;
    });

    if ( region ){
      logger.info('Setting guest region', {
        region: region
      });

      req.user.attributes.region_id = region.id;
    } else {
      logger.info( 'Setting default region', options.defaultRegion );
      req.user.attributes.region_id = options.defaultRegion;
    }

    return next();
  };
};