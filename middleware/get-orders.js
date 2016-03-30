var db = require('../db');
var moment = require('moment-timezone');
var utils = require('../utils');
var orders = require('../lib/stamps/db/orders');

module.exports = function(options) {
  return function(req, res, next) {
    var logger = req.logger.create('Get Orders Middleware');

    var stampOpts = utils.extend({}, options, req.query, {
      filters: res.locals.filters
    });

    var sql = orders( stampOpts ).get();

    db.orders.find(sql.$query, sql.$options, function(err, orders) {
      if (err) {
        logger.error('Unable to find orders', err);
        return res.send(500);
      }

      if ( options.reverse ) orders = orders.reverse();
      if ( options.indexBy ) orders = utils.groupBy(orders, options.indexBy);

      if ( options.rename) {
        res.locals[options.rename] = orders;
      } else {
        res.locals.orders = orders;
      }

      next();
    });
  };
}
