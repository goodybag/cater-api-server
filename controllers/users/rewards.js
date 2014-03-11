/**
 * Rewards
 */

var Models  = require('../../models');
var utils   = require('../../utils');

module.exports.list = function( req, res, next ){
  var tasks = {
    pendingPoints: Models.User.getPendingPoints.bind( null, req.param('uid') )
  , pendingOrders: Models.User.getOrdersWithPendingPoints.bind( null, req.param('uid') )
  , orders: function( done ){
      Models.orders.find( $query, function( error, orders ){
        if ( error ) return done( error );

        return
      });
    }
  };

  utils.async.parallel( tasks, function( error, results ){
    if ( error ) return res.error( error );

    req.session.user.pendingPoints  = results.pendingPoints;
    res.locals.pendingOrders        = results.pendingOrders;
    res.locals.orders               = results.orders;

    res.render('my-rewards');
  });
};