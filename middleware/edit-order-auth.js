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

  models.Order.findOne(query, function(err, order) {
    if ( err )
      return res.error(500, err);
    else if ( !order )
      return res.render(404);
    else if ( utils.contains(statuses, order.attributes.status) )
      return res.render('shared-link/submitted');
    else if ( moment(order.attributes.edit_token_expires) < moment() )
      return res.render('shared-link/expired');

    // record order creator id
    req.creatorId = order.attributes.user.id;

    models.User.findOne(order.attributes.user.id, function(err, user) {
      if (err) return res.error(500, err);
      req.user = user;
      res.locals.user = user.toJSON();
      res.locals.edit_token = token;
      next();
    });
  });
};
