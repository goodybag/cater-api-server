/**
 * Middleware for authenticating individual ordering
 */

var models = require('../models');
var utils = require('../utils');
var moment = require('moment');
var statuses = ['submitted', 'accepted', 'denied'];

module.exports = function(req, res, next) {
  var qlk = new utils.Qlock();
  qlk.profile('editorderauth');
  var token = req.query.edit_token || req.body.edit_token;
  delete req.body.edit_token;

  if ( !token ) return next();

  var query = {
    where: {
      edit_token: token
    }
  };

  var order = req.order;
  if ( utils.contains(statuses, order.attributes.status) )
    return res.render('shared-link/submitted');
  else if ( moment(order.attributes.edit_token_expires) < moment() )
    return res.redner('shared-link/expired');

  // record order creator id
  req.creatorId = order.attributes.user.id;
  req.locals.edit_token = token;
  qlk.profile('editorderauth');
  next();
};
