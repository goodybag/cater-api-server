/**
 * Router /payments
 */

var express     = require('express');
var config      = require('../config');
var errors      = require('../errors');
var utils       = require('../utils');
var db          = require('../db');
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
    , service_fee: 0
    });

    return next();
  }

  // Create Charge
, function( req, res, next ){
    var charge = OrderCharge({
      adjustment_amount: +req.body.amount
    , service_fee:       +req.body.service_fee
    , restaurant:         req.restaurant
    });

    var data = {
      currency:             'usd'
    , amount:               charge.getTotal()
    , customer:             req.body.customer
    , source:               req.body.source
    , statement_descriptor: req.body.statement_descriptor
    , metadata:             utils.extend( req.body.metadata || {}, {
                              charge_destination: 'Funds go to Goodybag'
                            , restaurant_id: req.restaurant.id
                            })
    };

    // Unless the restaurant has a plan, everything goes in our account
    if ( req.restaurant.plan ){
      data.application_fee = charge.getApplicationCut();
      data.destination = req.restaurant.stripe_id;
      data.statement_descriptor = 'Funds go to Restaurant';
    }


    utils.stripe.charges.create( data, function( error, result ){
      if ( error ){
        return res.error( error );
      }

      req.charge = result;

      return next();
    });
  }

, function( req, res ){
    res.json( req.charge );
  }
);
