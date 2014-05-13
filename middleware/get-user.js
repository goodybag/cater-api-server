var models = require('../models');
var utils = require('../utils');

module.exports = function(req, res, next) {
  if(!req.session || !req.session.user || req.session.user.id == null) return next();

  var query = {
    where: { id: req.session.user.id }
  , embeds: ['groups']
  }

  models.User.findOne(query, function (error, user) {
    if (error) return next(error);

    req.user = user;
    res.locals.isAdmin = req.user.isAdmin = utils.contains(req.user.attributes.groups, 'admin');
    res.locals.isRestaurant = req.user.isRestaurant =
      utils.contains(req.user.attributes.groups, 'restaurant') &&
      utils.contains(req.user.attributes.restaurant_ids, parseInt(req.param('rid')));

    res.locals.user = user.toJSON();
    delete res.locals.user.password;

    next();
  });
}
