/**
 * Get Regions
 * Caches result for `options.age` (default 1 hour)
 * This means we can safely in-advertently declare this middleware
 * twice for the same request.
 *
 */

var utils = require('../utils');
var db    = require('../db');

module.exports = function( options ){
  options = utils.defaults( options || {}, {
    limit:  'all'
  , where:  {}
            // Refresh every hour
  , age:    1000*60*60
  });

  var end = 0;
  var regions = [];

  return function( req, res, next ){
    if ( regions.length && Date.now() < end ){
      res.locals.regions = regions;
      return next();
    }

    db.regions.find( options.where, options, function( error, results ){
      if ( error ) return next( error );

      regions = results;
      res.locals.regions = regions;
      end = Date.now() + options.age;

      return next();
    });
  };
};