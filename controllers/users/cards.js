var db      = require('../../db');
var queries = require('../../db/queries');
var errors  = require('../../errors');
var utils   = require('../../utils');
var config  = require('../../config');
var states  = require('../../public/states');
var models  = require('../../models');

/**
 * POST /users/:uid/cards
 *
 * Set the first address as default, for convenience
 */
module.exports.create = function(req, res, next) {
  models.User.find({ where: {user_id: req.params.uid, is_default: true}}, function(error, cards) {
    var noExistingDefault = !cards.length;
    var address = new models.User(utils.extend(
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
 * GET /users/:uid/cards
 */
module.exports.list = function(req, res, next) {
  var query = {
    where: { user_id: req.params.uid }
  , order: { id: 'asc' }
  };
  models.User.find(query, function(error, cards) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.render('cards', { cards: utils.invoke(cards, 'toJSON'), states: states });
  });
};

/**
 * GET /users/:uid/cards/:cid
 */
module.exports.get = function(req, res, next) {
  models.User.findOne(req.params.cid, function(error, address) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.render('address-edit', { address: address.toJSON(), states: states });
  });
};

/**
 * PUT /users/:uid/cards/:cid
 */
module.exports.update = function(req, res, next) {
  var updates = utils.pick(req.body, ['name', 'street', 'street2', 'city', 'state', 'zip', 'is_default', 'phone', 'delivery_instructions']);

  // TODO: make this a transaction
  utils.async.series([
    function unmarkPreviousDefaults(callback) {
      if (updates.is_default) {
        models.User.update({
          updates: { is_default: false },
          where:   { is_default: true, user_id: req.params.uid }
        }, callback);
      } else {
        callback(null);
      }
    },
    function updateAddress(callback) {
      var address = new models.User(utils.extend(updates, {id: req.params.cid}));
      address.save(callback);
    }
  ],
  function updateComplete(error, results) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    return res.send(204);
  });
};

/**
 * DELETE /users/:uid/cards/:cid
 */
module.exports.remove = function(req, res, next) {
  models.User.findOne(parseInt(req.params.cid), function(error, address) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    if (address === null) return res.send(404);

    address.destroy(function(error, response) {
      if (error) return res.error(errors.internal.DB_FAILURE, error);
      res.send(204);
    });
  });
};
