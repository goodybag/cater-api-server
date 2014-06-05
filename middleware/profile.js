/**
 * Profile
 *
 * Usage:
 *
 * app.get('/my-route'
 *  // Start profiling
 * , m.profile('My Middleware Chain')
 * , m.myMiddleware()
 *  // Stop profiling
 * , m.profile('My Middleware Chain') // Closing
 * );
 */

var utils = require('../utils');

module.exports = function( name, options ){
  name = name || 'Profiler'

  options = utils.defaults( options, {

  });

  return function( req, res, next ){
    if ( !req.profiler ) req.profiler = {};

    if ( !req.profiler[ name ] ){
      req.profiler[ name ] = new Date();
      return next();
    }

    var result = new Date() - req.profiler[ name ];
    delete req.profiler[ name ];

    console.log( name + ': ' + result + 'ms' );
    next();
  };
};