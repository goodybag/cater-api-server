var utils = require('utils');
var db = require('db');

module.exports = function(options) {
  options = utils.defaults({}, options, {
    param: 'rid'
  });
  return function(req, res, next) {
    var restaurant_id = req.params[options.param];
    var $query = { restaurant_id: restaurant_id };
    var $options = { order: 'id desc' };
    db.restaurant_payments.find($query, $options, function(err, payments) {
      if ( err ) return res.send(500, 'unable to find payments');
      res.locals.payments = payments;
      return next();
    });
  };
};
