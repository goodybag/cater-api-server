/**
 * Sets the region according to orderParams/search
 * for guest accounts
 */

var utils = require('../utils');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    field: 'orderParams'
  });

  return function( req, res, next ){
    var logger = req.logger.create('SetGuestRegion');

    if ( !req.user.isGuest() ){
      return next();
    }

    if ( !req.session[ options.field ] || !req.session[ options.field ].zip ){
      return next();
    }

    var region = utils.find( req.regions, function( region ){
      region.zips.indexOf( req.session[ options.field ].zip ) > -1;
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