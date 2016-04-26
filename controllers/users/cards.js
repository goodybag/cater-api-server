var db      = require('../../db');
var queries = require('../../db/queries');
var errors  = require('../../errors');
var utils   = require('../../utils');
var config  = require('../../config');
var models  = require('../../models');

/**
 * POST /users/:uid/cards
 */
module.exports.create = function(req, res, next) {
  var logger = req.logger.create('Controller-Users-Cards-List');

  if (!req.body.data || !req.body.token_id) return res.error(errors.input.VALIDATION_FAILED, 'data');

  utils.stripe.customers.createCard(
    req.user.attributes.stripe_id
  , { source: req.body.token_id }
  , function(err, card) {
      if (err) {
        logger.error('error adding card to stripe customer', err);

        if ( err.code === 'card_declined' ){
          return res.error( errors.stripe.CARD_DECLINED );
        }

        if ( err.code === 'expired_card' ){
          return res.error( errors.stripe.CARD_EXPIRED );
        }

        return res.error(errors.stripe.ERROR_ADDING_CARD)
      }
      var pmData = utils.extend( {}, req.body, { stripe_id: req.body.data.id } );
      var userId = +req.params.uid;

      db.users_payment_methods.create( userId, pmData, ( error, result )=>{
        if ( error ){
          logger.error('Error adding payment method to user', {
            user_id: userId
          , pmData
          });

          return res.error( errors.internal.DB_FAILURE, error );
        }

        return res.json( result );
      });
    }
  );
};

/**
 * GET /users/:uid/cards
 */
module.exports.list = function(req, res, next) {
  var query = {
    order: { id: 'asc' }
  };

  models.User.findPaymentMethods(+req.params.uid, query, function(error, cards) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    var context = {
      cards: cards
    };
    res.render('payment/cards', context);
  });
};

/**
 * GET /users/:uid/cards/:cid
 */
module.exports.get = function(req, res, next) {
  var query = {
    where: {
      id: +req.params.cid
    }
  };

  models.User.findPaymentMethods(+req.params.uid, query, function(error, cards) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    if (!cards || cards.length === 0) return res.send(404);
    res.json(cards[0]);
  });
};

/**
 * PUT /users/:uid/cards/:cid
 */
module.exports.update = function(req, res, next) {
  models.User.updatePaymentMethods( +req.params.uid, +req.params.cid, req.body, function(error, cards) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    if (!cards || cards.length === 0) return res.send(404);
    return res.send(204);
  });
};

/**
 * DELETE /users/:uid/cards/:cid
 */
module.exports.remove = function(req, res, next) {
  models.User.removeUserPaymentMethod( +req.params.uid, +req.params.cid, function(error, cards) {
    if (error) return res.error(errors.internal.DB_FAILURE, error);
    if (!cards || cards.length === 0) return res.send(404);
    return res.redirect('/users/me/cards');
  });
};
