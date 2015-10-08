/**
 * Restrict
 */

var utils = require('../utils');

module.exports = function(groups) {
  if (typeof groups === 'string') groups = groups.trim().split(' ');
  return function(req, res, next) {
    var logger = req.logger.create('Middleware-Restrict');
    logger.info('Checking groups');

    if (utils.intersection(req.user.attributes.groups, groups).length === 0){
      // Not logged in at all? Redirect
      if (!req.user.attributes.id){
        logger.info('User not logged in, redirecting to', '/login?next=' + req.originalUrl);
        return res.redirect('/login?next=' + req.originalUrl);
      }

      logger.warn('User attempting to access restricted resource. Sending `404`', {
        groupsRequired: groups
      });

      return res.send(404);
    }

    return next();
  }
}
