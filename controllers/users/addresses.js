var db = require('../../db')
  , queries = require('../../db/queries')
  , errors = require('../../errors')
  , utils = require('../../utils')
  , config = require('../../config')
  , states = require('../../public/states')
  , Address = require('../../models/address');

/**
 * POST /users/:uid/addresses
 *
 * Set the first address as default, for convenience
 */
module.exports.create = function(req, res, next) {
  Address.find({ where: {user_id: req.params.uid, is_default: true}}, function(error, addresses) {
    var noExistingDefault = !addresses.length;
    var address = new Address(utils.extend(
      {}, 
      req.body, 
      {user_id: req.session.user.id}, 
      noExistingDefault ? {is_default: true} : {}
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
  Address.find(query, function(error, addresses) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.render('addresses', { addresses: utils.invoke(addresses, 'toJSON'), states: states });
  });
};

/**
 * GET /users/:uid/addresses/:aid
 */
module.exports.get = function(req, res, next) {
  Address.findOne(req.params.aid, function(error, address) {
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

  utils.async.series([
    function unmarkPreviousDefaults(callback) {
      if (updates.is_default) {
        Address.update({
          updates: { is_default: false },
          where:   { is_default: true, user_id: req.params.uid }
        }, callback);
      }
      callback(null);
    },

    function updateAddress(callback) {
      var address = new Address(utils.extend(updates, {id: req.params.aid}));
      address.save(function(error, address) {
        if (error) return res.error(errors.internal.DB_FAILURE, error);
        return res.send(204);
      });
      callback(null);
    }
  ]);
};

/**
 * DELETE /users/:uid/addresses/:aid
 */
module.exports.remove = function(req, res, next) {
  Address.findOne(parseInt(req.params.aid), function(error, address) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    if (address === null) return res.send(404);

    address.destroy(function(error, response) {
      if (error) return res.error(errors.internal.DB_FAILURE, error);
      res.send(204);
    });
  });
};
