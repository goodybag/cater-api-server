/**
 * Geocode Body
 * Checks the body of a request to see if there is a geocodable address.
 * If so, geocodes. Sends back an error if the address is invalid.
 * Otherwise, attaches `lat_lng` to req.body.
 *
 * Usage:
 *
 * app.post('/addresses'
 * , m.geocodeBody() 
 * , m.insert( db.addresses )
 * );
 *
 * Options: {
 *   defaultsWith: String // - Path to obj on req that will serve
 *                        //   as the default values for req.body
 *                        //   when performing the geocoding request.
 *                        //   Useful for patch updates
 * }
 *
 * app.patch('/addresses/:id'
 * , function( req, res, next ){
 *     db.db.addresses.findOne( req.params.id )( req, res, next );
 *   }
 *   // Use the previously fetched `address` to serve as default
 *   // Properties for the geocode request
 * , m.geocodeBody({ defaultsWith: 'address' })
 * , m.update( db.addresses )
 * );
 */

var utils           = require('../utils');
var Address         = require('stamps/addresses');
var GeocodeRequest  = require('stamps/requests/geocode');
var errors          = require('../errors');

module.exports = function( options ){
  options = utils.defaults( options || {}, {

  });

  return function( req, res, next ){
    var logger = req.logger.create('Middleware-GeocodeBody');

    if ( req.body.address ){
      return GeocodeRequest()
        .address( req.body.address )
        .send( function( error, result ){
          if ( error ){
            return next( error );
          }

          if ( !result.isValidAddress() ){
            return res.error( errors.input.INVALID_ADDRESS );
          }

          utils.extend( req.body, result.toAddress() );

          return next();
        });
    }

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
      .address( bodyAddress.toString({ street2: false }) )
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