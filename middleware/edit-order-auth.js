/**
 * Middleware for shared order authentication
 *   - Check and validate edit_token
 *     - Order hasn't been submitted
 *     - Shared Link hasn't expired
 *   - Attaches req.user and req.order
 */

var db = require('../db')
var utils = require('../utils');
var moment = require('moment');
var statuses = ['submitted', 'accepted', 'denied'];

module.exports = function(req, res, next) {
  var token = req.query.edit_token;
  var logger = req.logger.create('Middleware-EditOrderAuth', {
    data: { token: token }
  });

  logger.info('Start');

  if ( !token ) {
    logger.info('No token, skipping');
    console.log(req.order);
    return next();
  }

  // // Check to see if we even need to use the edit token to auth
  // if ( utils.hasPropsDeep( req, ['user.attributes.groups'] ) )
  // if ( utils.intersection( req.user.attributes.groups, ['admin', 'client'] ).length >= 1 ){
  //   logger.info('User is logged in as admin or client, skipping');
  //   return next();
  // }

  var tasks = [
    function getOrder(done) {
      // Get req.order or lookup by edit_token
      if (req.order) return done(null, req.order);

      var $query = { where: { edit_token: token } };
      var $options = { one: [ { table: 'users', alias: 'user' } ] }

      db.orders.findOne($query, $options, function(err, order) {
        if ( err ){
          logger.error('Error looking up order', err);
          return done(err);
        } else if (!order){
          logger.info('No order found');
          done(null, null);
        } else {
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
