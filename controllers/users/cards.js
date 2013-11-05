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
  models.User.createPaymentMethod( +req.param('uid'), req.body, function(error, cards) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    return res.json(cards[0]);
  });
};

/**
 * GET /users/:uid/cards
 */
module.exports.list = function(req, res, next) {
  var query = {
    order: { id: 'asc' }
  };

  models.User.findPaymentMethods(+req.param('uid'), query, function(error, cards) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    res.json(cards);
  });
};

/**
 * GET /users/:uid/cards/:cid
 */
module.exports.get = function(req, res, next) {
  var query = {
    where: {
      id: +req.param('cid')
    }
  };

  models.User.findPaymentMethods(+req.param('uid'), query, function(error, cards) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    if (!cards || cards.length === 0) return res.send(404);
    res.json(cards[0]);
  });
};

/**
 * PUT /users/:uid/cards/:cid
 */
module.exports.update = function(req, res, next) {
  models.User.udpatePaymentMethod( +req.param('uid'), +req.param('cid'), req.body, function(error, cards) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    if (!cards || cards.length === 0) return res.send(404);
    return res.send(204);
  });
};

/**
 * DELETE /users/:uid/cards/:cid
 */
module.exports.remove = function(req, res, next) {
  models.User.removePaymentMethod( +req.param('cid'), function(error, cards) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    if (!cards || cards.length === 0) return res.send(404);
    return res.send(204);
  });
};
