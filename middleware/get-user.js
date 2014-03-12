var models = require('../models');
var utils = require('../utils');

module.exports = function(req, res, next) {
  if(!req.session || !req.session.user || req.session.user.id == null) return next();

  models.User.findOne({where: {id: req.session.user.id}}, function (error, user) {
    if (error) return next(error);

    req.user = user;
    req.user.isAdmin = utils.contains(req.user.attributes.groups, 'admin');
    req.user.isRestaurant =
      utils.contains(req.user.attributes.groups, 'restaurant') &&
      utils.contains(req.user.attributes.restaurant_ids, parseInt(req.params.rid));

    res.locals.user = user.toJSON();
    delete res.locals.user.password;

    next();
  });
}
