/**
 * Validate Address
 */

var errors          = require('../errors');
var utils           = require('../utils');
var GeoCodeRequests = require('stamps/requests/geocode');
var Addresses       = require('stamps/addresses');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    addressFields: ['street', 'street2', 'city', 'state', 'zip']
  , reqPath: 'body'
  });

  return function( req, res, next ){
    var address = Addresses( utils.getProperty( req, options.reqPath ) );

    GeoCodeRequests()
      .address( address.toString() )
      .send( function( error, geoRes ){
        if ( error ){
          logger.error('Error getting address validity', {
            address:  req.params.address
          , error:    error
          });

          return res.error( errors.internal.UNKNOWN, err );
        }

        if ( !geoRes.isValidAddress() ){
          return res.error( errors.input.INVALID_ADDRESS );
        }

        return next();
      });
  };
};