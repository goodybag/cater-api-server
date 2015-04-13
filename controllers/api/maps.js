var db              = require('db');
var utils           = require('utils');
var config          = require('config');
var GeoCodeRequests = require('stamps/requests/geocode');
var Addresses       = require('stamps/addresses');
var logger          = require('../../lib/logger').create('Controller-API-Maps');
var errors          = require('../../errors');

module.exports.addressValidity = function( req, res ){
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

      res.send({
        address: req.params.address
      , valid:   geoRes.isValidAddress()
      })
    });
};