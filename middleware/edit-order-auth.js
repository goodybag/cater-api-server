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

  var logger = req.logger.create('Middleware-EditOrderAuth', {
    data: { token: token }
  });

  var order = req.order;

  logger.info('Start');

  if ( !token ) return logger.info('No token, skipping'), next();

  // Check to see if we even need to use the edit token to auth
  if ( req.user.attributes.id === req.order.user_id ){
    return next();
  }

  // Incorrect token? Do nothing and let the restrict middleware
  // do its thing
  if ( req.order.edit_token !== token ){
    return next();
  }

  if ( req.user.attributes.groups.indexOf('admin') < 0 ){
    if ( utils.contains(statuses, order.status) ){
      return res.render('shared-link/submitted');
    }
  }

  req.creatorId = order.user_id;
  res.locals.edit_token = token;
  req.user.attributes.groups.push('order-editor');
  next();
};
