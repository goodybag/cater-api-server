/**
 * Get User
 */

var config          = require('../config');
var utils           = require('../utils');
var Models          = require('../models');
var sessionAndUser  = require('../lib/session-and-user');

module.exports = function( options ){
  options = utils.defaults( options || {}, {

  });

  var queryOptions = {
    one:  [ { table: 'users', alias: 'user'
            , one:  []
            , many: [ { table: 'users_groups', alias: 'groups' }
                    , { table: 'addresses' }
                    ]
            }
          ]
  };

  var uOne = queryOptions.one[0].one;
  var uMany = queryOptions.one[0].many;

  return function( req, res, next ){
    sessionAndUser({
      secret: config.session.secret
    , cookie: config.session.cookie
    , resave: config.session.resave
    , saveUninitialized: config.session.saveUninitialized
    , queryOptions: queryOptions
    })( req, res, function( error ){
      if ( error ) return next( error );

      if ( !req.session || !req.session.user || req.session.user.id == null ){
        req.user = new Models.User(
          utils.extend( { groups: ['guest'], name: 'Guest' }, req.session.user )
        );
      } else {
        req.user = req.session.user;
        req.session.user = { id: req.user.id };

        req.user.groups = utils.pluck( req.user.groups, 'group' );
        req.user = new Models.User( req.user );

        // todo: find better solution
        req.user.isAdmin = utils.contains(req.user.attributes.groups, 'admin');
        req.user.isRestaurant =
          utils.contains(req.user.attributes.groups, 'restaurant') &&
          utils.contains(req.user.attributes.restaurant_ids, parseInt(req.param('rid')));
      }

      res.locals.session = req.session;
      res.locals.user = req.user.toJSON();

      next();
    });
  };
};
