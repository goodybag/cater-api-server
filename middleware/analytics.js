var analytics = require('analytics-node');
var config = require('../config');

// initialize the write key ...
analytics.init({ secret: config.segmentIo.secret });

module.exports = function(req, res, next) {
  req.analytics = analytics;
  next();
}