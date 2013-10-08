var db = require('../../db')
  , queries = require('../../db/queries')
  , errors = require('../../errors')
  , utils = require('../../utils')
  , config = require('../../config')
  , Address = require('../../models/address');

module.exports.create = function(req, res, next) {
  next();
};

/**
 * GET /users/:uid/addresses
 */
module.exports.list = function(req, res, next) {
  var query = { 
    where: {
      user_id: req.params.uid 
    }
  };
  Address.find(query, function(error, addresses) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.render('addresses', { addresses: utils.invoke(addresses, 'toJSON') });
  });
};

/**
 * GET /users/:uid/addresses/:aid
 */
module.exports.get = function(req, res, next) {
  var query = { 
    where: {
      user_id: req.params.uid
    , id:      req.params.aid
    }
  };
  Address.findOne(query, function(error, address) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.render('address-edit', { address: address.toJSON() });
  });
};

module.exports.update = function(req, res, next) {
  Address.findOne(parseInt(req.params.aid), function(error, address) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    if (address === null) return res.send(404);

    // Replace address fields
    var updates = utils.pick(req.body, ['street', 'city', 'state', 'zip']);
    utils.extend(address.attributes, updates);

    address.save(function(error, address) {
      if (error) return res.error(errors.internal.DB_FAILURE, error);
      res.render('address-edit', { address: address[0], flash: 'Saved Successfully' });
    });
  });
};

module.exports.del = function(req, res, next) {
  next();
};