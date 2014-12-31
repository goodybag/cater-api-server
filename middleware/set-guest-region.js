/**
 * Sets the region according to orderParams/search
 * for guest accounts
 */

var utils = require('../utils');

module.exports = function( options ){
  options = utils.defaults( options || {}, {

  });

  return function( req, res, next ){
    if ( !req.user.isGuest() ){
      return next();
    }

    if ( !req.session.orderParams || !req.session.orderParams.zip ){
      return next();
    }

    req.user.attributes.region_id = utils.find( req.regions, function( region ){
      region.zips.indexOf( req.session.orderParams.zip ) > -1;
    });
  };
};