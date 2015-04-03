var utils = require('utils');
var db = require('db');

// todo: add logger
// todo: refactor weird data expectations

// various stripe replated middleware
var stripe = {
  createRestaurantPayment: function(options) {
    return function(req, res, next) {
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
        next();
      });
    };
  }
, logRestaurantPayment: function(options) {
    return function(req, res, next) {
      var data = utils.omit(req.restaurant_payment, 'destination');
      if ( !data ) return res.send(500, 'Missing Restaurant Payment');;
      db.restaurant_payments.insert(data, { returning: ['*'] }, function(err, result) {
        if ( err ) return res.send(500, err);
        return res.send(200, result);
      });
    };
  }
};

module.exports = stripe;
