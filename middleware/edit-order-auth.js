/**
 * Middleware for authenticating individual ordering
 */

var models = require('../models');
var utils = require('../utils');
var moment = require('moment');
var statuses = ['submitted', 'accepted', 'denied'];

module.exports = function(req, res, next) {
  var token = req.query.edit_token || req.body.edit_token;
  delete req.body.edit_token;

  if ( !token ) return next();

  var query = {
    where: {
      edit_token: token
    }
  };

  var order = req.order;
  if ( utils.contains(statuses, req.order.status) )
    return res.render('shared-link/submitted');
  else if ( moment(req.order.edit_token_expires) < moment() )
    return res.render('shared-link/expired');

  // record order creator id
  req.creatorId = req.order.user_id;
  res.locals.edit_token = token;
  next();
};
