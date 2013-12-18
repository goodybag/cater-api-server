var db      = require('../../db');
var queries = require('../../db/queries');
var errors  = require('../../errors');
var utils   = require('../../utils');
var config  = require('../../config');
var models  = require('../../models');
var logger = require('../../logger');

/**
 * POST /users/:uid/cards
 */
module.exports.create = function(req, res, next) {
  var TAGS = [req.uuid, 'users-cards-create'];

  if (!req.body.data || !req.body.data.uri) return res.error(errors.input.VALIDATION_FAILED, 'uri');
  utils.balanced.Customers.addCard(req.user.attributes.balanced_customer_uri, req.body.data.uri, function (error, customer) {
    if (error) return logger.routes.error(TAGS, 'error adding card to balanced customer', error), res.error(errors.balanced.ERROR_ADDING_CARD);
    models.User.createPaymentMethod( +req.param('uid'), req.body, function(error, card) {
      if (error) return logger.db.error(TAGS, 'error adding payment method to user: ' + req.user.attributes.id, error), res.error(errors.internal.DB_FAILURE, error);
      return res.json(card);
    });
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
    var context = {
      cards: cards
    };
    res.render('payment/user-payments', context);
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
  models.User.updatePaymentMethods( +req.param('uid'), +req.param('cid'), req.body, function(error, cards) {
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
