var utils = require('utils');

// various stripe replated middleware
var stripe = {
  insertRestaurantPayment: function(options) {
    return function(req, res, next) {
      var done = function(err) {
        if ( err )
          return res.send(500, err);
        next();
      };
      var amount = req.body.amount;
      var stripe_id = req.restaurant.stripe_id;
      console.log(req.restaurant);
      console.log(amount, stripe_id);
      if ( !amount || !stripe_id)
        return res.send(500, 'Missing arguments');

      utils.stripe.transfers.create({
        amount: amount
      , destination: req.restaurant.stripe_id
      , currency: 'USD'
      }, done);
    }
  }
};

module.exports = stripe;
