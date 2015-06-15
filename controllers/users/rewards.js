/**
 * Rewards
 */

var path    = require('path');
var fs      = require('fs');
var Models  = require('../../models');
var db      = require('../../db');
var utils   = require('../../utils');
var config  = require('../../config');
var venter  = require('../../lib/venter');
var errors  = require('../../errors');

module.exports.list = function( req, res ){
  var user = req.user.attributes;

  var tasks = {
    'pendingPoints':  Models.User.getPendingPoints.bind( Models.User, req.params.uid )

  , 'pendingOrders':  db.orders.findWithPendingPoints.bind( db.orders, {
                        user_id:        req.params.uid
                      }, {
                        order:          { datetime: 'desc' }
                      , one:            [{ table: 'restaurants', alias: 'restaurant' }]
                      , submittedDate:  true
                      })

  , 'orders':         Models.Order.find.bind( Models.Order, {
                        where: {
                          status: { $or: ['submitted', 'accepted', 'delivered'] }
                        , points_awarded: true
                        , user_id: req.params.uid
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
            card.afterPurchase = user.points - card.cost;
          });
        }

        return done( null, cards );
      });
    }
  };

  utils.async.parallel( tasks, function( error, results ){
    if ( error ) return res.error( error );

    res.locals.user.pendingPoints = results.pendingPoints;
    res.locals.pendingOrders      = results.pendingOrders;
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

  if ( req.user.attributes.points < req.body.points ){
    return res.error( errors.input.VALIDATION_FAILED );
  }

  Models.User.removePoints( req.params.uid, req.body.cost, function( error ){
    if ( error ) return res.error( errors.internal.DB_FAILURE, error );

    res.send( 204 );

    venter.emit( 'reward:redeemed', req.body, req.params.uid );
  });
};
