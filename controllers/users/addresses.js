var db = require('../../db')
  , queries = require('../../db/queries')
  , errors = require('../../errors')
  , utils = require('../../utils')
  , config = require('../../config')
  , Address = require('../../models/address');

/**
 * POST /users/:uid/addresses
 */
module.exports.create = function(req, res, next) {
  var address = new Address({
    user_id:      req.session.user.id
  , street:       req.body.street
  , city:         req.body.city
  , state:        req.body.state
  , zip:          req.body.zip
  , is_default:   false
  });
  address.save(function(error, address) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.redirect('/users/me/addresses');
  });
};

/**
 * GET /users/:uid/addresses/new
 */
module.exports.edit = function(req, res, next) {
  res.render('address-create');
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

/**
 * PUT /users/:uid/addresses/:aid
 */
module.exports.update = function(req, res, next) {
  var aid = parseInt(req.params.aid);
  Address.findOne(aid, function(error, address) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    if (address === null) return res.send(404);

    var updates = utils.pick(req.body, ['street', 'city', 'state', 'zip', 'is_default']);
    utils.extend(address.attributes, updates);
    utils.async.series([
      function unmarkPreviousDefault(callback) {
        if (updates.is_default) {
          Address.findOne({ where: {is_default: true}}, function(error, prevAddress) {
            if (prevAddress) {
              prevAddress.attributes.is_default = false;
              prevAddress.save(function(error, prevAddress) {
                if (error) return res.error(errors.internal.DB_FAILURE, error);
                callback(null);
              });
            } 
          });
        }
        callback(null);
      },

      function updateAddress(callback) {
        address.save(function(error, address) {
          if (error) return res.error(errors.internal.DB_FAILURE, error);
          if (updates.is_default) return res.send(200);
          res.render('address-edit', { address: address[0], flash: 'Saved Successfully' });
        });
        callback(null);
      }
    ]);
  });
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
      res.send(200);
    });
  });
};
