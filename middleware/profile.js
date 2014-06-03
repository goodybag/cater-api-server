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
 * , m.profile() // Closing
 * );
 */

var utils = require('../utils');

module.exports = function( name, options ){
  name = name || 'Profiler'

  options = utils.defaults( options, {

  });

  return function( req, res, next ){
    if ( !req.profileStart ){
      req.profileStart = new Date();
      return next();
    }

    var result = new Date() - req.profileStart;
    delete req.profileStart;

    console.log( name + ': ' + result + 'ms' );
    next();
  };
};