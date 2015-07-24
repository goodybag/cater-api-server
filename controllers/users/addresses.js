var db = require('../../db')
  , queries = require('../../db/queries')
  , errors = require('../../errors')
  , utils = require('../../utils')
  , config = require('../../config')
  , states = require('../../public/js/lib/states')
  , models = require('../../models')
  , Address = require('stamps/addresses')
  , GeocodeRequest = require('stamps/requests/geocode');

module.exports.validateAndGeocode = function( options ){
  return function( req, res, next ){
    var addr = Address( req.body );

    GeocodeRequest()
      .address( addr.toString({ street2: false }) )
      .send( function( error, result ){
        if ( error ){
          return res.error( errors.internal.UNKNOWN, error );
        }

        if ( !result.isValidAddress() ){
          return res.error( errors.input.INVALID_ADDRESS );
        }

        req.body.lat_lng = result.toAddress().lat_lng;

        return next();
      });
  }
};

/**
 * POST /users/:uid/addresses
 *
 * Set the first address as default, for convenience
 */
module.exports.create = function(req, res, next) {
  models.Address.find({ where: {user_id: req.params.uid, is_default: true}}, function(error, addresses) {
    var noExistingDefault = !addresses.length;
    var address = new models.Address(utils.extend(
      {},
      req.body,
      {user_id: req.session.user.id, is_default: !!(req.body.is_default || noExistingDefault)} // ensure is_default is boolean
    ));

    address.save(function(error, address) {
      if (error) return res.error(errors.internal.DB_FAILURE, error);
      res.send(204);
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
  var updates = utils.pick(req.body, ['name', 'street', 'street2', 'city', 'state', 'zip', 'is_default', 'phone', 'delivery_instructions']);

  // TODO: make this a transaction
  utils.async.series([
    function unmarkPreviousDefaults(callback) {
      if (updates.is_default) {
        models.Address.update({
          updates: { is_default: false },
          where:   { is_default: true, user_id: req.params.uid }
        }, callback);
      } else {
        callback(null);
      }
    },
    function updateAddress(callback) {
      var address = new models.Address(utils.extend(updates, {id: req.params.aid}));
      address.save(callback);
    }
  ],
  function updateComplete(error, results) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    return res.send(204);
  });
};

/**
 * DELETE /users/:uid/addresses/:aid
 */
module.exports.remove = function(req, res, next) {
  models.Address.findOne(parseInt(req.params.aid), function(error, address) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    if (address === null) return res.send(404);

    address.destroy(function(error, response) {
      if (error) return res.error(errors.internal.DB_FAILURE, error);
      res.send(204);
    });
  });
};
