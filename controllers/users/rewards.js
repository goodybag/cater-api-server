/**
 * Rewards
 */

var path    = require('path');
var fs      = require('fs');
var Models  = require('../../models');
var utils   = require('../../utils');

module.exports.list = function( req, res, next ){
  var tasks = {
    'pendingPoints':  Models.User.getPendingPoints.bind( Models.User, req.param('uid') )

  , 'pendingOrders':  Models.User.getOrdersWithPendingPoints.bind( Models.User, req.param('uid'), {
                        order: { datetime: 'desc' }
                      })

  , 'orders':         Models.Order.find.bind( Models.Order, {
                        where: {
                          status: { $or: ['submitted', 'accepted', 'delivered'] }
                        , points_awarded: true
                        , user_id: req.param('uid')
                        }
                      })

  , cards: function( done ){
      var file = path.join( __dirname, '../../giftcards.json' );
      fs.readFile( file, function( error, cards ){
        if ( error ) return done( error );

        cards = cards.toString();

        return done( null, cards ? JSON.parse( cards ) : null );
      });
    }
  };

  utils.async.parallel( tasks, function( error, results ){
    if ( error ) return console.log( error ), res.error( error );

    req.session.user.pendingPoints  = results.pendingPoints;
    res.locals.pendingOrders        = utils.invoke( results.pendingOrders, 'toJSON' );
    res.locals.orders               = utils.invoke( results.orders, 'toJSON' );
    res.locals.cards                = results.cards;

    res.render('my-rewards');
  });
};