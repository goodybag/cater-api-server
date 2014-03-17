/**
 * Rewards
 */

var path    = require('path');
var fs      = require('fs');
var Models  = require('../../models');
var utils   = require('../../utils');
var venter  = require('../../lib/venter');
var errors  = require('../../errors');

module.exports.list = function( req, res ){
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

        if ( cards ){
          cards = JSON.parse( cards );

          cards.forEach( function( card ){
            card.afterPurchase = req.session.user.points - card.cost;
          });
        }

        return done( null, cards );
      });
    }
  };

  utils.async.parallel( tasks, function( error, results ){
    if ( error ) return res.error( error );

    res.locals.user.pendingPoints = results.pendingPoints;
    res.locals.pendingOrders      = utils.invoke( results.pendingOrders, 'toJSON' );
    res.locals.orders             = utils.invoke( results.orders, 'toJSON' );
    res.locals.cards              = results.cards;

    res.render('rewards');
  });
};

module.exports.redeem = function( req, res ){
  var required = [ 'amount', 'cost', 'location' ];

  if ( utils.intersection( required, Object.keys( req.body ) ).length !== required.length ){
    return res.error( errors.input.VALIDATION_FAILED );
  }

  Models.User.removePoints( req.param('uid'), req.body.cost, function( error ){
    if ( error ) return res.error( errors.internal.DB_FAILURE, error );

    res.send( 204 );

    venter.emit( 'reward:redeemed', req.body, req.param('uid') );
  });
};