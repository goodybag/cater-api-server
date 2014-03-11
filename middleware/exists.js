/**
 * Control flow based on existence
 * of an object under express `req` object.
 *
 * Example: Checking req.user.name
 * ```
 * app.use(exists('user.name'), {
 *   then: function(req, res, next) { ... }
 * , else: function(req, res, next) { ... }
 * });
 * ```
 *
 * @param {object} prop - check existence of prop under the request object
 * @param {object} opts - an object containing two functions
 *   then - middleware executed if prop exists
 *   else - middleware executed otherwise
 */
var utils = require('../utils');

var exists = function( prop, opts ) {

  return function(req, res, next) {
    var check = getProperty(req, prop);
    var noop = function() {};
    opts.then = opts.then || noop;
    opts.else = opts.else || noop;
    (check ? opts.then : opts.else).apply(this, arguments);
  };
};

/**
 * Access object properties via string
 * supporting nested access
 *
 * Example
 * ```
 * getProperty(user, 'attributes.name') === user.attributes.name
 * ```
 *
 * @param {object} obj - source object
 * @param {string} prop - target property relative to object
 * @return obj property
 */
var getProperty = function( obj, prop ) {
  if (prop.indexOf('.') < 0) return obj[prop];
  var parts = prop.split('.')
    , last = parts.pop()
    , len = parts.length
    , idx = 1
    , current = parts[0];

  while( (obj = obj[current]) && idx < len ) {
    current = parts[idx++];
  }
  if ( obj )
    return obj[last];
  return obj;
}

module.exports = exists;
