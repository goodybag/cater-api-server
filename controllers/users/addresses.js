var db = require('../../db')
  , queries = require('../../db/queries')
  , errors = require('../../errors')
  , utils = require('../../utils')
  , config = require('../../config')
  , states = require('../../public/js/lib/states')
  , Addresses = require('stamps/addresses/user-addresses-db')
  , GeocodeRequest = require('stamps/requests/geocode')
  , models = require('../../models');

/**
 * POST /users/:uid/addresses
 *
 * Set the first address as default, for convenience
 */
module.exports.create = function(req, res, next) {
  var logger = req.logger.create('Controller-Create-Address');

  logger.info('Create user Address');

  var address = Addresses( req.body );

  address.setLogger( logger );

  address.user_id = req.params.uid;

  if ( !address.hasMinimumComponents() ){
    logger.warn('Invalid address');
    return res.error( errors.input.INVALID_ADDRESS );
  }

  GeocodeRequest()
    .address( address.toString() )
    .send( function( error, result ){
      if ( error ){
        logger.warn('Error geocoding address', {
          error: error
        });

        return res.error( 'httpCode' in error ? error : errors.internal.UNKNOWN, error );
      }

      if ( !result.isValidAddress() ){
        return res.error( errors.input.INVALID_ADDRESS );
      }

      utils.extend( address, result.toAddress() );

      address.save( function( error ){
        if ( error ){
          logger.warn('Error saving address', {
            error: error
          });

          return res.error( 'httpCode' in error ? error : errors.internal.DB_FAILURE, error );
        }

        return res.json( address );
      });
    });
};

/**
 * GET /users/:uid/addresses
 */
module.exports.list = function(req, res, next) {
  var query = {
    where: { user_id: req.params.uid }
  , order: { id: 'asc' }
  };
  models.Address.find(query, function(error, addresses) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.render('addresses', { addresses: utils.invoke(addresses, 'toJSON'), states: states });
  });
};

/**
 * GET /users/:uid/addresses/:aid
 */
module.exports.get = function(req, res, next) {
  models.Address.findOne(req.params.aid, function(error, address) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.render('address-edit', { address: address.toJSON(), states: states });
  });
};

/**
 * PUT /users/:uid/addresses/:aid
 *
 * Updating address with is_default == true will
 * set other addresses to false.
 */
module.exports.update = function(req, res, next) {
  var logger = req.logger.create('Controller-Update-Address');

  logger.info('Update user Address');

  db.addresses.findOne( { user_id: req.params.uid, id: req.params.aid }, function( error, existing ){
    if ( error ){
      logger.warn('Error looking up adddress', {
        error: error
      });

      return res.error( errors.internal.DB_FAILURE, error );
    }

    var address = Addresses( utils.extend( existing, req.body ) );

    address.setLogger( logger );

    if ( !address.hasMinimumComponents() ){
      logger.warn('Invalid address');
      return res.error( errors.input.INVALID_ADDRESS );
    }

    GeocodeRequest()
      .address( address.toString() )
      .send( function( error, result ){
        if ( error ){
          logger.warn('Error geocoding address', {
            error: error
          });

          return res.error( 'httpCode' in error ? error : errors.internal.UNKNOWN, error );
        }

        if ( !result.isValidAddress() ){
          return res.error( errors.input.INVALID_ADDRESS );
        }

        address.lat_lng = result.toAddress().lat_lng;

        address.save( function( error ){
          if ( error ){
            logger.warn('Error saving address', {
              error: error
            });

            return res.error( 'httpCode' in error ? error : errors.internal.DB_FAILURE, error );
          }

          return res.json( address );
        });
      });
  });
};

/**
 * DELETE /users/:uid/addresses/:aid
 */
module.exports.remove = function(req, res, next) {
  var query = { where: {
    user_id:  req.params.uid
  , id:       req.params.aid
  }};

  models.Address.findOne(query, function(error, address) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    if (address === null) return res.send(404);

    address.destroy(function(error, response) {
      if (error) return res.error(errors.internal.DB_FAILURE, error);
      res.send(204);
    });
  });
};
