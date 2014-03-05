/**
 * Attaches segment.io for server side tracking
 * under `req.analytics`
 */

var analytics = require('analytics-node');
var config = require('../config');

analytics.init({ secret: config.segmentIo.secret });

module.exports = function(req, res, next) {
  req.analytics = analytics;
  next();
}