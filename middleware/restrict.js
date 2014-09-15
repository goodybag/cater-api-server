var utils = require('../utils');

module.exports = function(groups) {
  if (typeof groups === 'string') groups = groups.trim().split(' ');
  return function(req, res, next) {
    var logger = req.logger.create('Middleware-Restrict');
    logger.info('Checking groups');

    if (req.creatorId){
      logger.info('Request has `creatorId` field, skipping group check', {
        creatorId: req.creatorId
      });

      next();
    }
    else if (req.order && req.order.isOwner){
      logger.info('Request has `order` field and `isOwner` is true, skipping group check');
      next();
    }
    else if (req.session.user == null || req.session.user.id == null){
      logger.info('User not logged in, redirecting to login', {
        redirectUrl: '/login?next=' + req.url
      });

      res.redirect('/login?next=' + req.url);
    }
    else if (utils.intersection(req.session.user.groups, groups).length === 0){
      logger.warn('User attempting to access restricted resource. Sending `404`', {
        groupsRequired: groups
      });

      res.send(404);
    }
    else {
      next();
    }
  }
}
