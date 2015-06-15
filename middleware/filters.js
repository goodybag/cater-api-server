/**
 * Attach dem filters
 *
 * Dynamically attach filters to resources
 * app.use(m.filters(['region-filters']));
 *
 * Note: you will want to attach this early in the middleware
 * stack so that other middleware can make use of the
 * res.locals.filters.
 */

var utils = require('../utils');
var logger = require('../lib/logger').create('Middleware:Filters');

var middleware = function(filters, db) {
  if (!db) {
    db = require('db');
  }
  return function middleware(req, res, next) {
    var fns = filters.map(function(filter) {
      return function(callback) {
        require('../lib/filters/' + filter)(callback, db);
      };
    });

    utils.async.parallel(fns, function(err, results) {
      if (err) return logger.error('Error: ' + err);
      req.filters = res.locals.filters = results.reduce(function(obj, format) {
        var filter = format(req.query.q);
        obj[filter.resource] = filter.data;
        return obj;
      }, {});
      next();
    });
  };
};

module.exports = middleware;
