var models = require('../models');
var utils = require('../utils');

module.exports = function(req, res, next) {
  if(!req.session || !req.session.user || req.session.user.id == null){
    if ( req.param('edit_token') ){
      req.user = new models.User({ groups: ['guest'], name: 'Guest' });
      req.user.isAdmin = false;
      req.user.isRestaurant = false;
      res.locals.user = req.user.toJSON();
    }
    return next();
  }

  var query = {
    where: { id: req.session.user.id }
  , embeds: ['groups']
  }

  models.User.findOne(query, function (error, user) {
    if (error) return next(error);

    req.user = user;
    req.user.isAdmin = utils.contains(req.user.attributes.groups, 'admin');
    res.locals.isAdmin = utils.contains(req.user.attributes.groups, 'admin');
    req.user.isRestaurant =
      utils.contains(req.user.attributes.groups, 'restaurant') &&
      utils.contains(req.user.attributes.restaurant_ids, parseInt(req.param('rid')));

    res.locals.user = user.toJSON();
    delete res.locals.user.password;

    next();
  });
}
