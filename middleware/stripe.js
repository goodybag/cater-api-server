var utils = require('utils');
var db = require('db');

// todo: refactor weird data expectations

// various stripe replated middleware
var stripe = {
  createRestaurantTransfer: function(options) {
    return function(req, res, next) {
      var logger = req.logger.create('Stripe Create Restaurant Payment');
      var data = req.restaurant_payment = res.locals.restaurant_payment =
        utils.defaults({}, options, {
          amount: req.body.amount
        , destination: req.restaurant.stripe_id
        , currency: 'USD'
        , restaurant_id: req.restaurant.id
        , error: null
        });
      if ( !data.amount || !data.destination )
        return res.send(500, 'Missing required stripe.transfers params');

      utils.stripe.transfers.create(utils.omit(data, 'error', 'restaurant_id'), function(err) {
        if ( err ) data.error = err.message;
        logger.info('Complete');
        next();
      });
    };
  }
, getRestaurantTransfers: function(options) {
    return function(req, res, next) {
      var id = req.restaurant.stripe_id;
      utils.stripe.transfers.list({ destination: id }, function(err, transfers) {
        if ( err ) return res.send(500, err);
        req.restaurant_transfers = res.locals.restaurant_transfers = transfers;
        next();
      });
    };
  }
};

module.exports = stripe;
