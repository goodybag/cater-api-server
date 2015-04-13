var models = require('../models');
var db = require('../db');
var utils = require('../utils');

module.exports = function(req, res, next) {
  var logger = req.logger.create('Middleware-GetUser');

  if(!req.session || !req.session.user || req.session.user.id == null){
    req.user = new models.User({ groups: ['guest'], name: 'Guest' });

    if ( req.params.edit_token ){
      req.user.isAdmin = false;
      req.user.isRestaurant = false;
      res.locals.user = req.user.toJSON();
      req.session.user = { id: res.locals.user.id };
    }

    if ( req.params.review_token ){
      req.user.isAdmin = false;
      req.user.isRestaurant = true;
      res.locals.user = req.user.toJSON();
      req.session.user = { id: res.locals.user.id };
    }

    logger.info('User not logged in, viewing as guest', { user: req.user });
    return next();
  }

  var query = {
    id: req.session.user.id
  };

  var options = {
    many: [ { table: 'users_groups', alias: 'groups' }
          , { table: 'addresses' }
          ]
  };

  logger.info( 'Looking up user', { user_id: req.session.user.id } );
  db.users.findOne( query, options, function (error, user) {
    logger.info('called back', { error: error, user: user });
    if (error){
      logger.error( 'Failed to lookup user', { error: error } );
      return next(error);
    }

    user.groups = utils.pluck( user.groups, 'group' );

    user = new models.User( user );

    req.user = user;

    req.user.isAdmin = utils.contains(req.user.attributes.groups, 'admin');
    req.user.isRestaurant =
      utils.contains(req.user.attributes.groups, 'restaurant') &&
      utils.contains(req.user.attributes.restaurant_ids, parseInt(req.params.rid));

    res.locals.user = user.toJSON();
    res.locals.user.isAdmin = req.user.isAdmin;
    delete res.locals.user.password;
    req.logger.options.data.user = res.locals.user;
    logger.info('User found')

    next();
  });
}
