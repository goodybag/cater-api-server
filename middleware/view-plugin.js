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

// If they pass in collection options, see if we need to parse params
viewPlugins.itemForm = {
  fn: function( options, req, res, done ){
    if ( !options.collectionOptions ){
      return done( null, options );
    }

    var collectionOptions = utils.clone( options );

    for ( var ok in options.collectionOptions ){
      var opt = collectionOptions[ ok ];

      if ( typeof opt !== 'string' ) continue;

      req.route.keys.forEach( function( key ){
        opt = opt.replace( new RegExp( ':' + key.name, 'g' ), req.param( key.name ) )
      });

      collectionOptions[ ok ] = opt;
    }

    return done( null, utils.extend( {}, options, { collectionOptions: collectionOptions } ) );
  }
};

viewPlugins.sidebarNav = {
  fn: function( options, req, res, done ){
    var url = options.baseUrl;

    req.route.keys.forEach( function( key ){
      url = url.replace( new RegExp( ':' + key.name, 'g' ), req.param( key.name ) )
    });

    done( null, utils.extend( {}, options, { baseUrl: url } ) );
  }
};