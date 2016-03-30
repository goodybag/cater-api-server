/**
 * Sets the region according to orderParams/search
 */

var utils = require('../utils');
var db    = require('../db')

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    defaultRegion: 1
  });

  return function( req, res, next ){
    var logger = req.logger.create('SetUserRegion');

    var region_id = options.defaultRegion;
    var zip = req.query.zip;

    if ( !zip ){
      zip = req.session.orderParams ? req.session.orderParams.zip : null;
    }

    var region = utils.find( req.regions, function( region ){
      return region.zips.indexOf( zip ) > -1;
    });

    if ( region ){
      region_id = region.id;
    }

    if ( !zip && !region && req.user.attributes.region_id ){
      req.user.attributes.region = utils.findWhere( req.regions, {
        id: req.user.attributes.region_id
      });

      return next();
    } else if ( zip && !region && req.user.attributes.region_id ) {
      req.user.attributes.region = utils.findWhere( req.regions, {
        id: req.user.attributes.region_id
      });

      return next();
    }

    logger.info('Region ID', region_id);
    if ( req.user.attributes.region_id !== region_id ){
      if ( !req.user.isGuest() ){
        logger.info('Updating user region', {
          user_id:    req.user.attributes.id
        , region_id:  region_id
        });

        db.users.update( req.user.attributes.id, { region_id: region_id }, function( error ){
          if ( error ){
            logger.error( 'Could not update user region', {
              user_id:    req.user.attributes.id
            , region_id:  region_id
            , error:      error
            });
          }
        });
      }

      req.user.attributes.region_id = region_id;
      req.session.user.region_id    = region_id;
      res.locals.user.region_id     = region_id;
    }

    req.user.attributes.region = utils.findWhere( req.regions, { id: region_id } );

    return next();
  };
};
