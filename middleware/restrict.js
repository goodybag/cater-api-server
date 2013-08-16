var utils = require('../utils');

module.exports = function(groups) {
  if (typeof groups === 'string') groups = groups.trim().split(' ');
  return function(req, res, next) {
    if (req.session.user == null || req.session.user.id == null)
      res.send(401);
    else if (utils.intersection(req.session.user.groups, groups).length === 0)
      res.send(403);
    else
      next();
  }
}
