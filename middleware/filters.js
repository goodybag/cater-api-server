/**
 * Attach dem filters
 *
 * Dynamically attach filters to resources
 * app.use(m.filters(['region-filters']));
 */

var utils = require('../utils');
var logger = require('../lib/logger').create('Middleware:Filters');

var filters = function(filters) {
  filters = filters.map(function(filter) {
    return function(callback) {
      require('../lib/filters/' + filter)(callback);
    };
  });

  utils.async.parallel(filters, function(err, results) {
    if (err) return logger.error('Error: ' + err);
    filters = results;
  });

  return function middleware(req, res, next) {
    res.locals.filters = filters.reduce(function(obj, format) {
      var filter = format(req.query.q);
      obj[filter.resource] = filter.data;
      return obj;
    }, {});
    next();
  };
};

module.exports = filters;
