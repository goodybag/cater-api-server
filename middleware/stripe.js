var utils = require('utils');
var db = require('db');

// various stripe replated middleware
var stripe = {
  createRestaurantPayment: function(options) {
    return function(req, res, next) {
      var data = req.restaurant_payment = res.locals.restaurant_payment =
        utils.defaults({}, options, {
          amount: req.body.amount
        , destination: req.restaurant.stripe_id
        , currency: 'USD'
        , error: null
        });
      if ( !data.amount || !data.destination )
        return res.send(500, 'Missing required stripe.transfers params');

      utils.stripe.transfers.create(utils.omit(data, 'error'), function(err) {
        if ( err ) data.error = err.message;
        next();
      });
    };
  }
, logRestaurantPayment: function(options) {
    return function(req, res, next) {
      var data = req.restaurant_payment;
      if ( !data ) return res.send(500, 'Missing Restaurant Payment');;
      db.restaurant_payments.insert(data, { returning: ['*'] }, function(err, result) {
        if ( err ) return res.send(500, 'Unable to record restaurant payment');
        return res.send(200, result);
      });
    };
  }
};

module.exports = stripe;
