var utils = require('../utils');
module.exports = function() {
  return function(req, res, next) {
    res.locals.states = require('../public/js/lib/states');
    next();
  }
}