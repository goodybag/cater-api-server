/**
 * Control flow based on existence
 * of an object under express `req` object.
 *
 * Example:
 *
 * Checking if `req.user.name` exists, run given
 * middleware function, otherwise next()
 *
 * ```
 * app.use(exists('user.name'), function(req, res, next) { ... })
 * ```
 *
 * or ternary style checking
 *
 * ```
 * app.use(exists('user.name'), {
 *   then: function(req, res, next) { ... }
 * , else: function(req, res, next) { ... }
 * });
 * ```
 *
 * @param {object} prop - check existence of prop under the request object
 * @param {object|function} opts - next middleware or an object containing
 *   then - middleware executed if prop exists
 *   else - middleware executed otherwise
 */
var utils = require('../utils');

var exists = function( prop, opts ) {

  return function(req, res, next) {
    var check = utils.getProperty(req, prop);

    // simple check and run fn
    if ( typeof opts === 'function')
      return check ? opts.apply(this, arguments) : next();

    // ternary style
    var noop = function() {};
    opts.then = opts.then || noop;
    opts.else = opts.else || noop;
    (check ? opts.then : opts.else).apply(this, arguments);
  };
};

module.exports = exists;
