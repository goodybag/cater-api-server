/**
 * Sets the region according to orderParams/search
 * for guest accounts
 */

var utils = require('../utils');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    field: 'orderParams'
  , whereToLook: ['query', 'session']
  , defaultRegion: 1
  });

  return function( req, res, next ){
    var logger = req.logger.create('SetGuestRegion');

    if ( !req.user.isGuest() ){
      return next();
    }

    var result = options.whereToLook.map( function( k ){
      return req[ k ][ options.field ];
    }).filter( function( v ){
      return [ null, undefined ].indexOf( v ) === 0;
    })[0];

    if ( !result ){
      logger.info( 'Setting default region', options.defaultRegion );
      req.user.attributes.region_id = options.defaultRegion;
      return next();
    }

    var region = utils.find( req.regions, function( region ){
      region.zips.indexOf( result.zip ) > -1;
    })[0];

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