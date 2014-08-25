var utils = require('../utils');

module.exports = function(groups) {
  if (typeof groups === 'string') groups = groups.trim().split(' ');
  return function(req, res, next) {
    if (req.creatorId)
      next();
    else if (req.order && req.order.isOwner)
      next();
    else if (req.session.user == null || req.session.user.id == null)
      res.redirect('/login?next=' + req.url);
    else if (utils.intersection(req.session.user.groups, groups).length === 0)
      res.send(404);
    else
      next();
  }
}
