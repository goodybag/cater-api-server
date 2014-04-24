var models = require('../models');
var utils = require('../utils');
var config = require('../config');

// map to parallel task
function tableReduce(memo, table) {
  memo[table] = function(done) {
    models[table].find({}, function(err, results) {
      done(err, utils.invoke(results, 'toJSON'));
    });
  };
  return memo;
}

/**
 * Attach database enums to res.locals
 * @param {array|string} specify specific enums
 */
function enums(opts) {
  var tables = config.enums;

  if ( typeof opts === 'string' ) {
    tables = [opts];
  } else if ( typeof opts === 'array') {
    tables = opts;
  }

  return function(req, res, next) {
    var tasks = utils.reduce(tables, tableReduce, {});
    utils.async.parallel(tasks, function(err, results) {
      if (err) return res.error(500);
      res.locals.enums = results;
      next();
    });
  }
}

module.exports = enums;