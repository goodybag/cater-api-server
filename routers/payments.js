/**
 * Router /payments
 */

var express     = require('express');
var config      = require('../config');
var errors      = require('../errors');
var utils       = require('../utils');
var m           = require('../middleware');
var OrderCharge = require('stamps/orders/charge');
var router      = module.exports = express.Router();

router.post('/'
, m.restrict(['admin', 'lunchroom'])
  // Fetch restaurant
, function( req, res, next ){
    var options = {
      one:  [ { table: 'restaurant_plans', alias: 'plan' }
            , { table: 'regions', alias: 'region' }
            ]
    };

    db.restaurants.findOne( req.body.restaurant_id, options, function( error, restaurant ){
      if ( error ){
        return res.error( errors.internal.DB_FAILURE, error );
      }

      if ( !restaurant ){
        return res.error( errors.input.INVALID_RESTAURANT );
      }

      req.restaurant = restaurant;

      return next();
    });
  }

  // Validate
, function( req, res, next ){
    utils.defaults( req.body, {
      statement_descriptor: 'Goodybag Charge'
    });

    return next();
  }

  // Create Charge
, function( req, res, next ){
    var charge = OrderCharge({
      adjustment_amount: +req.body.amount
    , restaurant:         req.restaurant
    });

    var data = {
      currency:             'usd'
    , amount:               charge.getTotal()
    , application_fee:      charge.getApplicationCut()
    , customer:             req.body.customer
    , source:               req.body.source
    , destination:          req.restaurant.stripe_id
    , statement_descriptor: req.body.statement_descriptor
    , meta_data:            utils.extend( req.meta_data, {
                              charge_destination: 'Funds go to Restaurant'
                            , restaurant_id: req.restaurant.id
                            })
    };

    utils.stripe.charges.create( data, function( error, result ){
      if ( error ){
        return res.error( error );
      }

      req.charge = result;
    });
  }

, function( req, res ){
    res.json( req.charge );
  }
);
