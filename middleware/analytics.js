/**
 * Attaches segment.io for server side tracking
 * under `req.analytics`
 */
var utils = require('../utils');

module.exports = function(req, res, next) {
  req.analytics = utils.analytics;
  next();
}