/**
 * Middleware for individual ordering checking
 *   - Edit token is valid
 *   - Order hasn't been submitted
 *   - Shared Link hasn't expired
 */

var db = require('../db')
var utils = require('../utils');
var moment = require('moment');
var statuses = ['submitted', 'accepted', 'denied'];

module.exports = function(req, res, next) {
  // we don't want to make any changes with the token downstream
  var token = req.query.edit_token || req.body.edit_token;
  delete req.body.edit_token;

  if ( !token ) return next();

  // Check to see if we even need to use the edit token to auth
  if ( utils.hasPropsDeep( req, ['user.attributes.groups'] ) )
  if ( utils.intersection( req.user.attributes.groups, ['admin', 'client'] ).length >= 1 ){
    return next();
  }

  var tasks = [
    function getOrder(done) {
      // Get req.order or lookup by edit_token
      if (req.order) return done(null, req.order);

      var $query = { where: { edit_token: token } };
      var $options = { one: [ { table: 'users', alias: 'user' } ] }

      db.orders.findOne($query, $options, function(err, order) {
        if (err)
          return done(err);
        else if (!order)
          done(null, null);
        else
          done(null, order);
      });
    },

    function auth(order, done) {
      if ( !order )
        return done(null);
      else if ( utils.contains(statuses, order.status) )
        return res.render('shared-link/submitted');
      else if ( moment(order.edit_token_expires) < moment() )
        return res.render('shared-link/expired');

      // Replace user with order creator
      req.user = order.user;

      // Attach shared order
      req.order = order;

      // req.creatorId = order.user_id;
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
