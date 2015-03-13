var utils = require('utils');
var config = require('config');

module.exports = {
  list: function(options) {
    return function listPayments(req, res, next) {
      var logger = req.logger.create('Payments List');
      var uri = res.locals.restaurant.balanced_customer_uri;
      utils.balanced.Credits.list({ action_uri: uri }, function(err, credits) {
        if ( err ) {
          return logger.error('Unable to list balanced credits');
        }
        res.send(200, credits);
      });
    };
  }
, credit: function(options) {
    return function creditAcct(req, res, next) {
      var customerUri = res.locals.restaurant.balanced_customer_uri;
      utils.balanced.Customers.getBankAccounts(customerUri, function(err, accts) {
        if ( err ) return res.send(err);
        if ( accts.items.length <= 0 ) res.send(500);

        var creditsUri = accts.items[0].credits_uri;
        var amount = 1234; // todo replace with payment_summary.total;
        var description = 'lol'; // comma separted list of orders ids from payment_summary.items
        utils.balanced.Credits.add(creditsUri, amount, description, function(err, response) {
          if ( err ) return res.send(err);
          res.send(response);
        });
      });
    };
  }
};
