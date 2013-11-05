var db      = require('../../db');
var queries = require('../../db/queries');
var errors  = require('../../errors');
var utils   = require('../../utils');
var config  = require('../../config');
var models  = require('../../models');

/**
 * POST /users/:uid/cards
 *
 * Set the first address as default, for convenience
 */
module.exports.create = function(req, res, next) {
  req.body.user_id = +req.param('uid');
  models.User.createPaymentMethod( req.body, function(error, cards) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    return res.send(204);
  });
};

/**
 * GET /users/:uid/cards
 */
module.exports.list = function(req, res, next) {
  var query = {
    where: { user_id: +req.param('uid') }
  , order: { id: 'asc' }
  };

  models.User.findPaymentMethods(query, function(error, cards) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.json(utils.invoke(cards, 'toJSON'));
  });
};

/**
 * GET /users/:uid/cards/:cid
 */
module.exports.get = function(req, res, next) {
  var query = {
    where: {
      user_id:  +req.param('uid')
    , id:       +req.param('cid')
    }
  };

  models.User.findPaymentMethods(query, function(error, cards) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    if (!cards || cards.length === 0) return res.send(404);
    res.json(cards[0].toJSON());
  });
};

/**
 * PUT /users/:uid/cards/:cid
 */
module.exports.update = function(req, res, next) {
  models.User.udpatePaymentMethod( +req.param('cid'), req.body, function(error, cards) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    return res.send(204);
  });
};

/**
 * DELETE /users/:uid/cards/:cid
 */
module.exports.remove = function(req, res, next) {
  models.User.removePaymentMethod( +req.param('cid'), function(error, cards) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    return res.send(204);
  });
};
