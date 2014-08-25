var models = require('../models');
var utils = require('../utils');

module.exports = function(req, res, next) {
  var logger = req.logger.create('GetUser');

  if(!req.session || !req.session.user || req.session.user.id == null){
    if ( req.param('edit_token') ){
      req.user = new models.User({ groups: ['guest'], name: 'Guest' });
      req.user.isAdmin = false;
      req.user.isRestaurant = false;
      res.locals.user = req.user.toJSON();
      req.session.user = res.locals.user;
    }
    return next();
  }

  var query = {
    where: { id: req.session.user.id }
  , embeds: ['groups']
  }

  logger.info( 'Looking up user', { user_id: req.session.user.id } );
  models.User.findOne( query, function (error, user) {
    if (error){
      logger.error( 'Failed to lookup user', { error: error } );
      return next(error);
    }

    req.user = user;
    req.user.isAdmin = utils.contains(req.user.attributes.groups, 'admin');
    req.user.isRestaurant =
      utils.contains(req.user.attributes.groups, 'restaurant') &&
      utils.contains(req.user.attributes.restaurant_ids, parseInt(req.param('rid')));

    res.locals.user = user.toJSON();
    res.locals.user.isAdmin = req.user.isAdmin;
    delete res.locals.user.password;

    req.logger.options.data.user = res.locals.user;

    next();
  });
}
