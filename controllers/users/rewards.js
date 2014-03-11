/**
 * Rewards
 */

var Models  = require('../../models');
var utils   = require('../../utils');

module.exports.list = function( req, res, next ){
  var tasks = {
    pendingPoints:  Models.User.getPendingPoints.bind( null, req.param('uid') )
  , pendingOrders:  Models.User.getOrdersWithPendingPoints.bind( null, req.param('uid'), {
                      order: { datetime: 'desc' }
                    })

  , orders:         Models.Order.find.bind( null, {
                      where: {
                        status: { $or: ['submitted', 'accepted', 'delivered'] }
                      , points_awarded: true
                      , user_id: req.param('uid')
                      }
                    })
  };

  utils.async.parallel( tasks, function( error, results ){
    if ( error ) return console.log( error ), res.error( error );
console.log(results);
    req.session.user.pendingPoints  = results.pendingPoints;
    res.locals.pendingOrders        = utils.invoke( 'toJSON', results.pendingOrders );
    res.locals.orders               = utils.invoke( 'toJSON', results.orders );

    res.render('my-rewards');
  });
};