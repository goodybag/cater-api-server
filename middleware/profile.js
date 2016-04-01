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
var createProfiler = require('../lib/profiler');

module.exports = function( name){
  name = name || 'Profiler'

  return function( req, res, next ){
    if ( !req.profiler ) req.profiler = createProfiler();
    req.profiler.profile( name );
    next();
  };
};