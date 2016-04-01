/**
 * Get User
 */

var config          = require('../config');
var utils           = require('../utils');
var Models          = require('../models');
var sessionAndUser  = require('../lib/session-and-user');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    omissions: [ 'password' ]
  });

  var queryOptions = {
    one:  [ { table: 'users', alias: 'user'
            , one:    [ { table: 'regions', alias: 'region' }
                      , { table: 'addresses', alias: 'defaultAddress'
                        , where: { is_default: true }
                        }
                      ]
            , many:   [ { table: 'addresses' }
                      , { table: 'features_users'
                        , alias: 'features'
                        , mixin: [{ table: 'features' }]
                        }
                      ]
            , pluck:  [ { table: 'users_groups', alias: 'groups', column: 'group' } ]
            }
          ]
  };

  var middleware = sessionAndUser({
    secret: config.session.secret
  , cookie: config.session.cookie
  , resave: config.session.resave
  , saveUninitialized: config.session.saveUninitialized
  , queryOptions: queryOptions
  });

  return function( req, res, next ){
    middleware( req, res, function( error ){
      if ( error ) return next( error );

      if ( !req.session || !req.session.user || req.session.user.id == null ){
        req.user = new Models.User(
          utils.extend({
            groups: ['guest']
          , name: 'Guest'
          , features: {}
          }, req.session.user )
        );

        if ( !req.session.user ){
          req.session.user = utils.cloneDeep(
            utils.omit( req.user.toJSON(), [
              'groups', 'password'
            ])
          );
        }
      } else {
        req.user = req.session.canonical;
        delete req.session.canonical;
        req.session.user = { id: req.user.id };

        req.user = new Models.User( req.user );
      }

      res.locals.session = req.session;

      Object.defineProperty( res.locals, 'user', {
        enumerable: true
      , get: function(){
          return utils.omit(req.user.toJSON(), options.omissions);
        }
      });

      if ( !req.user.isGuest() ){
        req.logger.options.data.req.user = req.logger.options.data.req.user || {};
        req.logger.options.data.req.user.id = req.user.attributes.id;
      }

      if ( Array.isArray( req.user.attributes.features ) ){
        req.user.attributes.features = req.user.attributes.features.reduce( function( result, feature ){
          result[ feature.id ] = feature;
          return result;
        }, {} );
      }

      next();
    });
  };
};
