/**
 * Categories->Cuisines
 * Takes yelp categories and turns them into our Cuisines
 */

var config  = require('../../../config');
var db      = require('../../../db');
var logger  = require('../logger').create('CategoriesToCuisines');

var cuisines = [];

db.cuisines.find( {}, { limit: 'all' }, function( error, _cuisines ){
  if ( error ) return logger.error('Could not lookup cuisines', { error: error });

  cuisines = _cuisines.map( function( c ){
    return c.name;
  });
});

module.exports = function( yelpBiz ){
  return {
    cuisines: yelpBiz.categories.map( function( cat ){
                return config.yelrp.fromCatsToCuisines[ cat[ 0 ] ];
              }).filter( function( cuisine ){
                return [ null, undefined ].indexOf( cuisine ) === -1;
              }).filter( function( cuisine ){
                return cuisines.indexOf( cuisine ) > -1;
              })
  };
};