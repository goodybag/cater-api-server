/**
 * Middleware for individual ordering checking
 *   - Edit token is valid
 *   - Order hasn't been submitted
 *   - Shared Link hasn't expired
 */

var models = require('../models');
var utils = require('../utils');
var moment = require('moment');
var statuses = ['submitted', 'accepted', 'denied'];

module.exports = function(req, res, next) {
  // we don't want to make any changes with the token downstream
  var token = req.query.edit_token || req.body.edit_token;
  delete req.body.edit_token;

  var logger = req.logger.create('EditOrderAuth', {
    data: { token: token }
  });

  logger.info('Start');

  if ( !token ) return logger.info('No token, skipping'), next();

  // Check to see if we even need to use the edit token to auth
  if ( utils.hasPropsDeep( req, ['user.attributes.groups'] ) )
  if ( utils.intersection( req.user.attributes.groups, ['admin', 'client'] ).length >= 1 ){
    logger.info('User is logged in as admin or client, skipping');
    return next();
  }

  var tasks = [
    function getOrder(done) {
      // Get req.order or lookup by edit_token
      if (req.order) return done(null, req.order);
      var query = { where: { edit_token: token } };
      models.Order.findOne(query, function(err, order) {
        if (err){
          logger.error('Error looking up order', err);
          return done(err);
        } else if (!order){
          logger.info('No order found');
          done(null, null);
        } else {
          order = order.toJSON();
          logger.info('Order found', { order: order })
          done(null, order);
        }
      });
    },

    function auth(order, done) {
      if ( !order )
        return done(null);
      else if ( utils.contains(statuses, order.status) )
        return res.render('shared-link/submitted');
      else if ( moment(order.edit_token_expires) < moment() )
        return res.render('shared-link/expired');

      // record order creator id
      req.creatorId = order.user_id;
      res.locals.edit_token = token;
      done(null , order);
    }
  ];

  utils.async.waterfall(tasks, function(err, order) {
    if ( err )
      return res.error(500, err);
    else if ( !order )
      return res.render(404);
    next();
  });
};
