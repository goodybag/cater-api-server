var utils = require('../utils');
var Address = require('stamps/addresses');
var GeocodeRequest = require('stamps/requests/geocode');
var errors = require('../errors');

module.exports = function( options ){
  options = utils.defaults( options || {}, {

  });

  return function( req, res, next ){
    var logger = req.logger.create('Middleware-GeocodeBody');
    var bodyAddress = Address( req.body );

    if ( options.defaultsWith ){
      utils.defaults( bodyAddress, req[ options.defaultsWith ] );
    }

    // No address info, no need to geocode
    if ( bodyAddress.fulfilledComponents().length === 0 ){
      return next();
    }

    // If neither the canonical nor the update contained `street`
    // then we really have chance
    if ( !bodyAddress.street ){
      return next();
    }

    logger.info( 'geocoding', bodyAddress );

    GeocodeRequest()
      .address( bodyAddress.toString() )
      .send( function( error, result ){
        if ( error ){
          return next( error );
        }

        if ( !result.isValidAddress() ){
          return res.error( errors.input.INVALID_ADDRESS );
        }

        req.body.lat_lng = result.toAddress().lat_lng;

        return next();
      });
  };
};