var db = require('../../db')
  , queries = require('../../db/queries')
  , errors = require('../../errors')
  , utils = require('../../utils')
  , config = require('../../config')
  , states = require('../../public/states')
  , Address = require('../../models/address');

/**
 * POST /users/:uid/addresses
 */
module.exports.create = function(req, res, next) {
  var address = new Address({
    user_id:      req.session.user.id
  , name:         req.body.name
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
 * GET /new-address
 */
module.exports.edit = function(req, res, next) {
  res.render('address-create', {states: states});
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
  var updates = utils.pick(req.body, ['name', 'street', 'city', 'state', 'zip', 'is_default']);

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
