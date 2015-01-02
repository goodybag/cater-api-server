/**
 * Sets the region according to orderParams/search
 * for guest accounts
 */

var utils = require('../utils');

module.exports = function( options ){
  options = utils.defaults( options || {}, {

  });

  return function( req, res, next ){
    var logger = req.logger.create('SetGuestRegion');

    if ( !req.user.isGuest() ){
      return next();
    }

    if ( !req.session.orderParams || !req.session.orderParams.zip ){
      return next();
    }

    var region = utils.find( req.regions, function( region ){
      region.zips.indexOf( req.session.orderParams.zip ) > -1;
    })[0];

    if ( region ){
      logger.info('Setting guest region', {
        region: region
      });

      req.user.attributes.region_id = region.id;
    }

    return next();
  };
};