var utils = require('utils');
var db = require('db');

// various stripe replated middleware
var stripe = {
  createRestaurantTransfer: function(options) {
    return function(req, res, next) {
      var logger = req.logger.create('Stripe Create Restaurant Transfer');
      var data = req.restaurant_payment = res.locals.restaurant_payment =
        utils.defaults({}, options, {
          amount: req.body.amount
        , destination: req.restaurant.stripe_id
        , currency: 'USD'
        });
      if ( !data.amount || !data.destination )
        return res.send(500, 'Missing required stripe.transfers params');

      utils.stripe.transfers.create(data, function(err, transfer) {
        if ( err ) {
          logger.error('Unable to create transfer');
          return res.send(500, err);
        }
        logger.info('Complete');
        return res.send(200, transfer);
      });
    };
  }
, getRestaurantTransfers: function(options) {
    return function(req, res, next) {
      var logger = req.logger.create('Stripe Get Restaurant Transfers');
      var id = req.restaurant.stripe_id;
      var query = utils.defaults({}, options, {
        destination: id
      , limit: 100
      });
      utils.stripe.transfers.list(query, function(err, transfers) {
        if ( err ) {
          logger.error('Unable to list transfers');
          return res.send(500, err);
        }
        req.restaurant_transfers = res.locals.restaurant_transfers = transfers;
        next();
      });
    };
  }
};

module.exports = stripe;
