var db              = require('db');
var utils           = require('utils');
var config          = require('config');
var GeoCodeRequests = require('stamps/requests/geocode');
var Addresses       = require('stamps/addresses');
var logger          = require('../../lib/logger').create('Controller-API-Maps');
var errors          = require('../../errors');

module.exports.geocode = function( req, res ){
  GeoCodeRequests()
    .address( req.params.address )
    .send( function( error, geoRes ){
      if ( error ){
        logger.error('Error getting address validity', {
          address:  req.params.address
        , error:    error
        });

        return res.error( errors.internal.UNKNOWN, err );
      }

      if ( !geoRes.isValidAddress() ){
        return res.send({ valid: false });
      }

      res.send({
        valid:   true
      , address: geoRes.toAddress()
      , lat_lon: geoRes.toLatLon()
      });
    });
};