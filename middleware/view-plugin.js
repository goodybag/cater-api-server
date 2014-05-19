/**
 * View Plugin
 * Provides a method for configuring view plugins
 * If some middleware functionality needs to occur for every
 * request using the view plugin, it's useful to register a new
 * view plugin. Each time a route is defined that configures
 * that plugin, then the functionality will run.
 * If the view plugin does not exist, then this simply sets:
 *   res.locals[ plugin_name ] = options;
 */

var utils = require('../utils');
var viewPlugins = {};

module.exports = function( name, options ){
  options = utils.defaults( options || {}, {

  });

  return function( req, res, next ){
    if ( !viewPlugins[ name ] ){
      res.locals[ name ] = options;
      return next();
    }

    viewPlugins[ name ].fn( options, req, res, function( error, result ){
      if ( error ) return next( error );

      res.locals[ name ] = result;
      next();
    });
  };
};

viewPlugins.sidebarNav = {
  fn: function( options, req, res, done ){
    options.baseUrl = req.originalUrl;
    done( null, options );
  }
};